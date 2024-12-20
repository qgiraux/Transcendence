from django.urls import path
from .views import CreateTournament, JoinTournament, Invite

urlpatterns = [
    path('create/', CreateTournament, name='create'),
    path('join/', JoinTournament, name='join'),
    path('invite/', Invite, name='invite'),
]