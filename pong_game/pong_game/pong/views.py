from django.shortcuts import render
# from pong import serializers
from rest_framework.views import APIView
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.template.exceptions import TemplateDoesNotExist



# @csrf_exempt
# @permission_classes([AllowAny])
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

# @csrf_exempt
# @permission_classes([AllowAny])
# class GameState(APIView):
#     def get(self, request):
#         game_id = request.query_params.get("game_id")
#         game = Game.objects.get(id=game_id)
#         serializer = GameStateSerializer(game)
#         return Response(serializer.data)

@csrf_exempt
@permission_classes([AllowAny])
def pong_view(request):
    try:
        context ={}
        return render(request, 'pong/index.html', context)
    except TemplateDoesNotExist:
        return HttpResponse("Template not found", status=404)

@csrf_exempt
@permission_classes([AllowAny])
def pong_test(request):
    return HttpResponse("Hello, world!")
