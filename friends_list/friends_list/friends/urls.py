from django.urls import path
from .views import add_friend , friends_list, remove_friend, get_csrf_token, remove_from_all


urlpatterns = [
    path('addfriend/', add_friend, name='add_friend'),
    path('friendslist/', friends_list, name='friends_list'),
    path('removefriend/', remove_friend, name='remove_friend'),
    path('removefromall/', remove_from_all, name='remove_friend'),
    path('csrf/', get_csrf_token, name='get_csrf'),
]
