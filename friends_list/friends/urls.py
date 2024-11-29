from django.urls import path
from .views import AddFriend , Friendslist, RemoveFriend


urlpatterns = [
    path('addfriend/', AddFriend, name='add friend'),
    path('friendslist/', Friendslist, name='friends list'),
    path('removefriend/', RemoveFriend, name='remove friend'),
]