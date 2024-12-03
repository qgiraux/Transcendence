from django.urls import path
from .views import add_block , blocks_list, remove_block, get_csrf_token


urlpatterns = [
    path('addblock/', add_block, name='add_block'),
    path('blockslist/', blocks_list, name='blocks_list'),
    path('removeblock/', remove_block, name='remove_block'),
    path('csrf/', get_csrf_token, name='get_csrf'),
]