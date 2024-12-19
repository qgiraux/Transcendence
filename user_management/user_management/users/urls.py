from django.urls import path
from .views import UserListView, Get_my_infos, Get_user_infos, ChangeLogin, DeleteUser, RegisterUser, ChangeNickname, CheckUserStatus, get_csrf_token, GetAllUsers, AddChannel
from django.contrib.auth.views import LoginView, LogoutView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView


urlpatterns = [
    path('register/', RegisterUser, name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('userinfo/', Get_my_infos, name='myuserinfo'),
    path('userinfo/<int:user_id>', Get_user_infos, name='userinfo'),
    path('newlogin/', ChangeLogin, name='change login'),
    path('newnickname/', ChangeNickname, name='change nickname'),
    path('deleteuser/', DeleteUser, name='delete user'),
    path('userstatus/<int:user_id>', CheckUserStatus, name='check user status'),
    path('csrf/', get_csrf_token, name='get csrf'),
    path('userlist/', GetAllUsers, name='user list'),
    path('addchannel/', AddChannel, name='add channel'),
    

]

# Example of calling reverse with user_id=10
# url = reverse('userinfo', kwargs={'user_id': 10})
# print(url)
