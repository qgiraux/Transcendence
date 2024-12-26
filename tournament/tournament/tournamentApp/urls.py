from django.urls import path
from .views import CreateTournament, JoinTournament, Invite, TournamentList, TournamentDetails

urlpatterns = [
    path('create/', CreateTournament, name='create'),
    path('join/', JoinTournament, name='join'),
    path('invite/', Invite, name='invite'),
    path('list/', TournamentList, name='list'),
    path('details/<str:name>', TournamentDetails, name='details'),
]