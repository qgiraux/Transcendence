import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.consumer import SyncConsumer
from .pong_game import Direction, PongEngine

log = logging.getLogger(__name__)

class PlayerConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		log.info("Connect")
		self.group_name = "pong_game"
		self.game = None
		log.info("Connected to game group")

		# Suscribe to the game group
		await self.channel_layer.group_add(self.group_name, self.channel_name)
		await self.accept()
	
	async def disconnect(self, close_code):
		# Leave the game group
		log.info("Disconnect: %s", close_code)
		if self.userid:
			await self.channel_layer.send(
				"game_engine",
				{"type": "player_leave", "userid": self.userid},
			)
		await self.channel_layer.group_discard(self.group_name, self.channel_name)
	
	async def join(self, data):
		userid = data.get("userid")
		if "userid" not in self.scope["session"]:
			self.scope["session"]["userid"] = userid
			self.scope["session"].save()
		self.userid = self.scope["session"]["userid"]
		log.info("User %s joined the game", self.userid)
		await self.channel_layer.send(
			"game_engine",
			{"type": "player_join", "userid": self.userid, "channel": self.channel_name},
		)
		
	async def receive(self, text_data=None, bytes_data=None):
		content = json.loads(text_data)
		msg_type = content.get("type")
		msg_data = content.get("data")
		match msg_type:
			case "join":
				await self.join(msg_data)
			case "move_paddle":
				await self.move_paddle(msg_data)
			case _:
				log.warning("Unknown message type: %s", msg_type)

	async def move_paddle(self, data):
		if not self.userid:
			log.info("User not joined")
			return

		log.info("User %s moved paddle", self.userid)
		direction = data.get("direction")
		await self.channel_layer.send(
			"game_engine",
			{"type": "move_paddle", "playerid": self.userid, "direction": direction},
		)
	
	async def game_update(self, event):
		log.info("Game update: %s", event)
		state = event["state"]
		await self.send(text_data=json.dumps(state))

	async def game_final_scores(self, event):
		game_over = event["game_over"]
		await self.send(text_data=json.dumps(game_over))

class PongConsumer(SyncConsumer):
	def __init__(self, *args, **kwargs):
		log.info("Game Engine Consumer:  %s %s", args, kwargs)
		super().__init__(*args, **kwargs)
		self.group_name = "pong_game"
		self.engine = PongEngine(self.group_name)
		self.engine.start()
		self.players = []
			
	def player_join(self, event):
		if len(self.players) >= 2:
			log.info("Game is full")
			return
		
		log.info("Player joined: %s", event)
		self.players.append(event["userid"])
		self.engine.add_player(event["userid"])

		if len(self.players) == 2:
			log.info("Starting game")
			self.engine.start_game()

	def player_leave(self, event):
		player = event.get("userid")
		log.info("Player left: %s", player)
		if player in self.players:
			self.players.remove(player)
			self.engine.player_leave(player)

	def player_move_paddle(self, event):
		log.info("Move paddle: %s", event)
		direction = event.get("direction")

		try:
			direction = Direction[direction]
		except KeyError:
			log.error("Invalid direction")
			return

		self.engine.get_player_paddle_move(event["userid"], direction)