from celery import shared_task
from .models import Game
from .game_logic import PongGame

def update_game_state(game_id):
	try:
		game = Game.objects.get(id=game_id)
		game.game_update_task()
	except Game.DoesNotExist:
		pass