import random
import uuid
import logging
import time
from enum import Enum, unique
from typing import Any, Mapping, Optional
import threading
import asyncio
import attr
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from datetime import datetime
from time import sleep
import httpx

log = logging.getLogger(__name__)

PADDLE_SPEED = 2 # 4 / canvasheight per tick if 30 tick per second
BALL_SPEED = 1.25 # 2.5 / canvaswidth per tick if 30 tick per second
BALL_ACCELERATION = 1.1

@unique
class Direction(Enum):
	UP = "up"
	DOWN = "down"


@attr.s
class Player:
	playerid = attr.ib()
	score = attr.ib(default=0, validator=attr.validators.instance_of(int))
	player_left = attr.ib(default = True, validator=attr.validators.instance_of(bool))




	@staticmethod
	def validate_paddle_y(_, __, value):
		if value < 10 or value > 90:
			raise ValueError("Paddle position out of bounds")
	paddle_y = attr.ib(default = 50, validator=validate_paddle_y)

	# might need a from_dict method to create a Player object from a dictionary
	@staticmethod
	def from_playerid(playerid):
		return Player(playerid=playerid, paddle_y=50, score=0)

	def render(self) -> Mapping[str, Any]:
		p = {
			"playerid": self.playerid,
			"player_left": self.player_left,
			"paddle_y": self.paddle_y,
			"score": self.score,
		}
		return p

	def move_paddle(self, direction: Direction):
		if direction == Direction.UP and self.paddle_y > 10:
			self.paddle_y -= PADDLE_SPEED
		elif direction == Direction.DOWN and self.paddle_y < 90:
			self.paddle_y += PADDLE_SPEED
		# else:
		# 	raise ValueError(f"Invalid direction: {direction}")

class Ball:
	def __init__(self, gameid):

		self.direction = [random.choice([-1, 1]), 0.2]
		self.speed = BALL_SPEED
		self.game = gameid
		self.game_width = 200  # Assuming game width is 200
		self.game_height = 100  # Assuming game height is 100
		self.position = [self.game_width / 2, self.game_height / 2]
		self.position[0] += self.speed * self.direction[0]
		self.position[1] += self.speed * self.direction[1]

	def move(self):
		self.position[0] += self.speed * self.direction[0]
		self.position[1] += self.speed * self.direction[1]

	def check_collisions(self, paddle_left, paddle_right):
		# Wall collisions
		if (self.position[1] <= 0 and self.direction[1] < 0) or (self.position[1] > self.game_height and self.direction[1] > 0):
			self.direction[1] = -self.direction[1]

		# Paddle collisions
		if (self.position[0] <= 10 and
			paddle_left - 10 <= self.position[1] <= paddle_left + 10) and self.direction[0] < 0:
			delta = self.position[1] - paddle_left
			self.direction[0] = -self.direction[0]
			self.speed *= BALL_ACCELERATION

			# Normalize the delta to a more reasonable angle adjustment
			self.direction[1] = (delta / 10)  # You can adjust this factor to control the bounce steepness

		elif (self.position[0] >= 190 and
			paddle_right - 10 <= self.position[1] <= paddle_right + 10) and self.direction[0] > 0:
			delta = self.position[1] - paddle_right
			self.direction[0] = -self.direction[0]
			self.speed *= BALL_ACCELERATION

			# Normalize the delta to a more reasonable angle adjustment
			self.direction[1] = (delta / 10)  # You can adjust this factor to control the bounce steepness

	def update_scoring(self, player1, player2):
		if self.position[0] <= 0:
			player2.score += 1
			self.speed = BALL_SPEED
			self.reset()
		elif self.position[0] >= self.game_width:
			player1.score += 1
			self.speed = BALL_SPEED
			self.reset()

	def reset(self):
		if self.position[0] < self.game_height:
			self.direction = [1, random.uniform(0.1, 0.3)]
		else:
			self.direction = [-1, random.uniform(0.1, 0.3)]
		self.position = [self.game_width / 2, self.game_height / 2]

	def render(self) -> Mapping[str, Any]:
		return {
			"position": self.position,
		}

@attr.s
class State:
	ball = attr.ib(
		attr.Factory(Ball), validator=attr.validators.instance_of(Ball)
	)
	score = 0
	player_left: Player = attr.ib(default=None)
	player_right: Optional[Player] = attr.ib(default=None)

	@staticmethod
	def from_dict(state_dict) -> "State":
		return State(
			ball=Ball(state_dict["ball"]["game"]),
			player_left=Player.from_dict(state_dict["player_left"]),
			player_right=Player.from_dict(state_dict["player_right"]) if state_dict.get("player_right") else None,
		)

	def render(self) -> Mapping[str, Any]:

		frame = {
			"ball": self.ball.render(),
			"player_left": self.player_left.render(),
			"player_right": self.player_right.render() if self.player_right else None,
		}
		return frame

class PongEngine(threading.Thread):
	TICK_RATE = 1 / 60  # 30 tick per second
	MAX_SCORE = 3

	def __init__(self, group_name, **kwargs):
		log.error("Initializing Pong Engine")
		super(PongEngine, self).__init__(daemon=True, name="PongEngine", **kwargs)
		self.group_name = group_name
		self.name = uuid.uuid4()
		self.channel_layer = get_channel_layer()
		self.state = State(ball=Ball(self.name))
		self.paddle_y_change: Mapping[str, Direction] = {}
		self.key_lock = threading.Lock()
		self.game_on = False
		self.ready_players = set()
		self.online_players = 0
		self.score = 0

	def run(self):
		if not (self.state.player_left is None or self.state.player_right is None):
			self.game_on = True
		# Use asyncio.run to manage the event loop in this thread
		try :
			self.loop = asyncio.get_event_loop()
		except RuntimeError:
			self.loop = asyncio.new_event_loop()
		try:
            # Block until both players are ready
			self.game_task = self.loop.create_task(self.game_loop())
		except Exception as e:
			log.error(f"Error during readiness check: {e}")

	async def game_loop(self):
		try:
			while len(self.ready_players) < 2:
				await asyncio.sleep(1)
			await self.broadcast_countdown()
			while self.game_on:
				self.state = self.tick()
				await self.broadcast_state()  # Directly await the async function
				if self.state.player_left.score >= self.MAX_SCORE or self.state.player_right.score >= self.MAX_SCORE:
					await self.end_game()
					log.error("Game %s is over", self.name)
					break
				tmp = self.state.player_left.score + self.state.player_right.score
				if tmp > self.score:
					log.error("Score changed from %s to %s", self.score, tmp)
					self.score = self.state.player_left.score + self.state.player_right.score
					await self.broadcast_countdown()
				await asyncio.sleep(self.TICK_RATE)
		except asyncio.CancelledError:
			log.error("Game loop cancelled")
			raise

	async def broadcast_state(self):
		state_json = self.state.render()
		await self.channel_layer.group_send(
			self.group_name, {"type": "game_update", "state": state_json}
		)

	async def broadcast_starting_state(self):
		self.online_players += 1
		log.error(f"number on online players : {self.online_players}")
		if self.online_players < 2:
			return
		state_json = self.state.render()
		log.error("Broadcasting starting state: %s", state_json)
		await self.channel_layer.group_send(
			self.group_name, {"type": "game_init", "state": state_json}
		)

	async def broadcast_countdown(self):
		log.error(f"Broadcasting countdown on group {self.group_name}")
		await self.channel_layer.group_send(
			self.group_name, {"type": "countdown", "data": 3}
		)
		await asyncio.sleep(0.5)
		await self.channel_layer.group_send(
			self.group_name, {"type": "countdown", "data": 2}
		)
		await asyncio.sleep(0.5)
		await self.channel_layer.group_send(
			self.group_name, {"type": "countdown", "data": 1}
		)
		await asyncio.sleep(0.5)
		await self.channel_layer.group_send(
			self.group_name, {"type": "countdown", "data": 0}
		)

	async def post_stats(self, url, data, headers):
		try:
			async with httpx.AsyncClient() as client:
				response = await client.post(url, json=data, headers=headers)
				response.raise_for_status()  # Raise an exception for HTTP errors
		except httpx.HTTPStatusError as e:
			log.error(f"HTTP error occurred: {e.response.status_code}")
		except Exception as e:
			log.error(f"Error posting stats: {e}")



	async def broadcast_game_over(self):
		state_json = self.state.render()
		state_json["winner"] = (
			self.state.player_left.playerid if self.state.player_left.score >= self.MAX_SCORE else self.state.player_right.playerid
		)
		state_json["tournament_id"] = self.group_name
		state_json["date"] = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
		state_json["p1"] = self.state.player_left.playerid
		state_json["p1score"] = self.state.player_left.score
		state_json["p2"] = self.state.player_right.playerid
		state_json["p2score"] = self.state.player_right.score
		if self.state.player_left.score == -1 or self.state.player_right.score == -1:
			state_json["score"] = "forfeit"
		else:
			state_json["score"] = f"{state_json['p1score']}/{state_json['p2score']}"
		log.error(f"sending game over to group {self.group_name}")
		await self.channel_layer.group_send(
			self.group_name, {"type": "game_over", "state": state_json}
		)

		try:
			p1_id = int(state_json["p1"])
			p2_id = int(state_json["p2"])
		except ValueError:
			log.error(f"Invalid player IDs: p1={state_json['p1']}, p2={state_json['p2']}")
			return

		log.error("Posting stats for players %s and %s", p1_id, p2_id)
		url1 = f"http://user_management:8000/adduserstats/{p1_id}"
		url2 = f"http://user_management:8000/adduserstats/{p2_id}"
		header = {
			"Content-Type": "application/json",
			"Accept": "application/json",  # Optional but recommended
			"Host": "localhost",
		}
		endJson = {
			"tournament_id": self.group_name,
			"date": datetime.now().strftime("%Y/%m/%d %H:%M:%S"),
			"opponent": self.state.player_right.playerid,
			"score": state_json["score"],
			"win": "yes" if self.state.player_left.score > self.state.player_right.score else "no"
		}
		# Post stats for player 1
		# log.error(endJson)
		await self.post_stats(url1, endJson, header)

		# Post stats for player 2
		endJson["win"] = "no" if self.state.player_left.score > self.state.player_right.score else "yes"
		endJson["opponent"] = state_json["p1"]
		# log.error(endJson)
		await self.post_stats(url2, endJson, header)


	def tick(self) -> State:
		state = self.state
		with self.key_lock:
			movements = self.paddle_y_change.copy()
			self.paddle_y_change.clear()
		state = self.process_paddle_movement(state, movements)
		state = self.process_ball_movement(state)
		return state

	def get_player_paddle_move(self, playerid, direction):
		log.error("Player %s moved paddle %s", playerid, direction)
		with self.key_lock:
			if direction == 'up':
				self.paddle_y_change[playerid] = Direction.UP
			elif direction == 'down':
				self.paddle_y_change[playerid] = Direction.DOWN

	def player_ready(self, userid):
		log.error("Player %s pressed READY", userid)
		log.error(f"score is set to {self.score}")
		self.ready_players.add(userid)
		if self.score != 0:
			self.ready_players.add(-1)


	async def add_player(self, playerid):
		log.error("Adding player %s to the game", playerid)

		if (
			(self.state.player_left and playerid == self.state.player_left.playerid) or
			(self.state.player_right and playerid == self.state.player_right.playerid)
		):
			log.error("Player %s already in game", playerid)
			return

		if self.state.player_left is None:
			self.state.player_left = Player(playerid=playerid)
			self.state.player_left.player_left = True
		elif self.state.player_right is None:
			self.state.player_right = Player(playerid=playerid)
			self.state.player_right.player_left = True
		else:
			log.error("Game is full, player %s cannot join", playerid)
			return

		log.error("Player %s joined the game", playerid)

	def process_paddle_movement(self, state, movements):
		# log.error("Processing paddle movements for game %s", self.name)

		if state.player_left.playerid in movements:
			state.player_left.move_paddle(movements[state.player_left.playerid])

		if state.player_right.playerid in movements:
			state.player_right.move_paddle(movements[state.player_right.playerid])

		return state

	def process_ball_movement(self, state):
		# log.error("Processing ball movements for game %s", self.name)

		ball = state.ball
		ball.move()
		ball.check_collisions(state.player_left.paddle_y, state.player_right.paddle_y)
		ball.update_scoring(state.player_left, state.player_right)
		return state

	def player_leave(self, playerid):
		log.error("Player %s left the game", playerid)
		if self.state.player_left.playerid == playerid:
			self.state.player_left.player_left = False
			self.state.player_right.score = self.MAX_SCORE
			self.state.player_left.score = -1
		elif self.state.player_right.playerid == playerid:
			self.state.player_right.player_left = False
			self.state.player_left.score = self.MAX_SCORE
			self.state.player_right.score = -1
		else:
			log.error("Player %s not in game", playerid)
			# log.error("game state is %s", self.state)
			return
		asyncio.create_task(self.end_game())

	async def end_game(self):
		log.error("Game %s is over, setting game_on to false...", self.name)
		self.game_on = False
		self.score = -1
		log.error("Game %s is over, boradcasting...", self.name)
		await self.broadcast_game_over()
		log.error("game over message sent")
		if self.game_task:
			self.game_task.cancel()
			try:
				await self.game_task
			except asyncio.CancelledError:
				log.error("Game loop task cancelled")
		self.online_players = 0
