from django.urls import path, include

from pong.views import pong_view, pong_test

urlpatterns = [
    path('pong/', pong_view, name='pong'),
    path('test/', pong_test, name='test'),
]