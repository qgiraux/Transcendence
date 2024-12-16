from django.shortcuts import render
# from pong import serializers
from rest_framework.views import APIView

# from rest_framework.response import Response
# from rest_framework import status
# from .models import Game
# from .serializers import StartGameSerializer, GameStateSerializer
# from .tasks import update_game_state

# class StartGameView(APIView):
# 	def post(self, request):
# 		serializer = StartGameSerializer(data=request.data)
# 		if serializer.is_valid():
# 			serializer.save()
# 			return Response(
# 				{"mesage": "Game started", "game": serializer.data},
# 				status=status.HTTP_201_CREATED)
# 		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class MovePaddle(APIView):
#     def post(self, request):
#         game_id = request.data.get("game_id")
#         player = request.data.get("player")
#         direction = request.data.get("direction")

#         # Fetch game and update paddle position
#         game = Game.objects.get(id=game_id)
#         ball_velocity = game.ball_velocity
#         paddle_attr = f"{player}_paddle"
#         if direction == "up":
#             setattr(game, paddle_attr, max(0, getattr(game, paddle_attr) - ball_velocity))
#         elif direction == "down":
#             setattr(game, paddle_attr, min(1, getattr(game, paddle_attr) + ball_velocity))
#         game.save()

#         return Response({"status": "success", "message": "Paddle moved"})

# class GameState(APIView):
#     def get(self, request):
#         game_id = request.query_params.get("game_id")
#         game = Game.objects.get(id=game_id)
#         serializer = GameStateSerializer(game)
#         return Response(serializer.data)

def pong_view(request):
    return render(request, '../static/index.html')