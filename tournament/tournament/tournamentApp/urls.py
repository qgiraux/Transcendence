from django.urls import path
from .views import CreateTournament, JoinTournament, Invite, TournamentList, TournamentDetails, DeleteTournament,unsubscribeAll, LeaveTournament

urlpatterns = [
    path('create/', CreateTournament, name='create'),
    path('join/', JoinTournament, name='join'),
    path('leave/', LeaveTournament, name='leave'),
    path('invite/', Invite, name='invite'),
    path('list/', TournamentList, name='list'),
    path('delete/', DeleteTournament, name='delete'),
    path('details/<str:name>', TournamentDetails, name='details'),
    path('allunsubscribe/', unsubscribeAll, name='unsubscribe_all'),\
]
