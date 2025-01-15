import json
import logging
import jwt
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.consumer import SyncConsumer
from .pong_game import Direction, PongEngine
from django.http import HttpResponse
from http import HTTPStatus
from django.conf import settings

log = logging.getLogger(__name__)

class PlayerConsumer(AsyncWebsocketConsumer):
    pong = dict.fromkeys(['name','game'])
    for game in pong:
        pong[game] = None

    async def connect(self):
        query_params = parse_qs(self.scope['query_string'].decode())
        token = query_params.get('token', [None])[0]
        if token:
            user_info = self.decode_token(token)
            if user_info:
                # Decode the token to get user_id and nickname
                self.user_id = user_info['user_id']
                self.nickname = user_info['nickname']
            else:
                await self.close()
                return HttpResponse("Invalid Token", status=HTTPStatus.UNAUTHORIZED) 
        else:
            await self.close()
            return HttpResponse("Token not provided", status=HTTPStatus.BAD_REQUEST)
        pong_game = 'pong_game'
        self.group_name = pong_game
        self.game = None

        # Suscribe to the game group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the game group
        if self.userid:
            await self.channel_layer.send(
                "game_engine",
                {"type": "player_leave", "userid": self.userid},
            )
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def join(self, data):
        userid = data.get("userid")
        game = data.get("name")
        self.gameName = game
        if "userid" not in self.scope["session"]:
            self.scope["session"]["userid"] = userid
            self.scope["session"].save()
        self.pong[game].player_join({"userid": userid})
        await self.channel_layer.send(
            game,
            {"type": "player_join", "userid": userid, "channel": self.channel_name},
        )

    async def create(self, data):
        log.error("Create game")
        log.error(data)
        data = data.get("data")
        gameName = data.get("name")
        if not gameName:
            log.error("Game name not provided")
            return  
        self.gameName = gameName
        if gameName not in self.pong:
            self.pong[gameName] = PongConsumer(self.group_name)
        log.error(f"Game created :{gameName}")

        
        
    async def receive(self, text_data=None, bytes_data=None):
        content = json.loads(text_data)
        msg_type = content.get("type")
        msg_data = content.get("data")
        log.error("Received message: %s", msg_data)
        match msg_type:
            case "join":
                await self.join(msg_data)
            case "move_paddle":
                await self.move_paddle(msg_data)
            case "create":
                log.error("Create game")
                await self.create(msg_data)
            case _:
                log.warning("Unknown message type: %s", msg_type)

    async def move_paddle(self, data):
        if not self.userid:
            log.error("User not correctly joined")
            return
        log.error("User %s moved paddle", self.userid)
        direction = data.get("direction")
        self.pong[self.gameName].engine.get_player_paddle_move(self.userid, direction)


    async def game_update(self, event):
        # log.error("Game update: %s", event)
        state = event["state"]
        await self.send(text_data=json.dumps(state))
    
    async def game_over(self, event):
        # log.error("Game update: %s", event)
        await self.send(text_data=json.dumps(event))
               

    async def game_final_scores(self, event):
        game_over = event["game_over"]
        await self.send(text_data=json.dumps(game_over))
    
    def decode_token(self, token):
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            log.error("Token expired")
        except jwt.InvalidTokenError:
            log.error("Invalid token")
        return None

class PongConsumer(SyncConsumer):
	def __init__(self, group, *args, **kwargs):
		log.error("Game Engine Consumer:  %s %s", args, kwargs)
		super().__init__(*args, **kwargs)
		self.group_name = group
		self.engine = PongEngine(self.group_name)
		self.engine.start()
		self.players = []
			
	def player_join(self, event):
		if len(self.players) >= 2:
			log.error("Game is full")
			return
		
		log.error("PongConsumer - Player joined: %s", event.get("userid"))
		self.players.append(event["userid"])

		self.engine.add_player(event["userid"])
        
		if len(self.players) == 2:
			log.error("Starting game")
			self.engine.run()

	def player_leave(self, event):
		player = event.get("userid")
		log.error("Player left: %s", player)
		if player in self.players:
			self.players.remove(player)
			self.engine.player_leave(player)

	def player_move_paddle(self, event):
		log.error("Move paddle: %s", event)
		direction = event.get("direction")
		try:
			direction = Direction[direction]
		except KeyError:
			log.error("Invalid direction")
			return
		self.engine.get_player_paddle_move(event["userid"], direction)