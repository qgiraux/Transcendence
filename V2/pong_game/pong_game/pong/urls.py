from django.urls import path, include

from pong.views import pong_view, pong_test

urlpatterns = [
    path('pong/', pong_view, name='pong'),
    path('test/', pong_test, name='test'),
    # path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
	# path('pong/start/', StartGameView.as_view(), name='start_game'),
	# path('pong/move/', MovePaddle.as_view(), name='move_paddle'),
	# path('pong/state/', GameState.as_view(), name='game_state'),
]