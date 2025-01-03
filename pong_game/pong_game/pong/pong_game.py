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

log = logging.getLogger(__name__)

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
		return {
			"playerid": self.playerid,
			"player_left": self.player_left,
			"paddle_y": self.paddle_y,
			"score": self.score,
		}

	def move_paddle(self, direction: Direction):
		log.error("Moving paddle %s", direction)
		if direction == Direction.UP and self.paddle_y > 10:
			self.paddle_y -= 1
		elif direction == Direction.DOWN and self.paddle_y < 90:
			self.paddle_y += 1
		else:
			raise ValueError(f"Invalid direction: {direction}")

class Ball:
	def __init__(self, gameid):
		self.position = [100, 50]
		self.direction = [random.choice([-1, 1]), 0.2]
		self.speed = 1
		self.game = gameid
		self.game_width = 200  # Assuming game width is 200
		self.position[0] += self.speed * self.direction[0]
		self.position[1] += self.speed * self.direction[1]

	def move(self):
		self.position[0] += self.speed * self.direction[0]
		self.position[1] += self.speed * self.direction[1]

	def check_collisions(self, paddle_left, paddle_right):
		# Wall collisions
		if self.position[1] <= 0 or self.position[1] >= 100:
			self.direction[1] = -self.direction[1]
		
		# Paddle collisions
		if (self.position[0] <= 10 and 
			paddle_left - 10 <= self.position[1] <= paddle_left + 10):
			delta = self.position[1] - paddle_left
			self.direction[0] = -self.direction[0]
			if (delta == 0):
				self.direction[1] = 0
			else:
				# adjust the *2 factor if you want to reduce the angle of the ball at extremes
				self.direction[1] = 2 / delta
		elif (self.position[0] >= 190 and
				paddle_right - 10 <= self.position[1] <= paddle_right + 10):
			delta = self.position[1] - paddle_right
			self.direction[0] = -self.direction[0]
			if (delta == 0):
				self.direction[1] = 0
			else:
				self.direction[1] = 2 / delta

	def update_scoring(self, player1, player2):
		if self.position[0] <= 0:
			player2.score += 1
			self.reset()
		elif self.position[0] >= 200:  # Assuming game width is 200
			player1.score += 1
			self.reset()
	def reset(self):
		self.position = [100, 50]
		self.direction = [random.choice([-1, 1]), 0.2]

	def render(self) -> Mapping[str, Any]:
		return {
			"position": self.position,
		}

@attr.s
class State:
	ball = attr.ib(
		attr.Factory(Ball), validator=attr.validators.instance_of(Ball)
	)
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
		# log.error("rendering")
		return {
			"ball": self.ball.render(),
			"player_left": self.player_left.render(),
			"player_right": self.player_right.render() if self.player_right else None,
		}

class PongEngine(threading.Thread):
	TICK_RATE = 0.033
	MAX_SCORE = 5

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



	def run(self):
		log.error("game Name:%s", self.group_name)
		log.error("player Left: %s", type(self.state.player_left))
		log.error("player Right: %s", type(self.state.player_right))

		if not (self.state.player_left is None or self.state.player_right is None):
			log.error("game is on!")
			self.game_on = True

		log.error("is game on? %s", self.game_on)

		# Use asyncio.run to manage the event loop in this thread
		loop = asyncio.get_event_loop()
		loop.create_task(self.game_loop())

	async def game_loop(self):
		while self.game_on:
			# log.error("Game %s is on!!", self.name)
			self.state = self.tick()
			await self.broadcast_state()  # Directly await the async function
			if self.state.player_left.score >= self.MAX_SCORE or self.state.player_right.score >= self.MAX_SCORE:
				self.end_game()
				log.error("Game %s is over", self.name)
				break
			await asyncio.sleep(self.TICK_RATE)

	async def broadcast_state(self):
		state_json = self.state.render()
		# log.error("Broadcasting state: %s", state_json)
		await self.channel_layer.group_send(
			self.group_name, {"type": "game_update", "state": state_json}
		)
	
	async def broadcast_game_over(self):
		state_json = self.state.render()
		await self.channel_layer.group_send(
			self.group_name, {"type": "game_over", "state": state_json}
		)

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

	def add_player(self, playerid):
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
			self.state.player_right.player_left = False
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
			self.state.player_left = None
			self.state.player_right.score = self.MAX_SCORE
		elif self.state.player_right.playerid == playerid:
			self.state.player_right = None
			self.state.player_left.score = self.MAX_SCORE
		else:
			log.error("Player %s not in game", playerid)
			return

		if self.state.player_left is None or self.state.player_right is None:
			log.error("Game %s is over", self.name)
			self.end_game()

	def end_game(self):
		self.game_on = False
		self.broadcast_game_over()
		async_to_sync(self.channel_layer.group_discard)(self.group_name, self.channel_name)