from django.urls import path
from .views import UserListView, Get_my_infos, Get_user_infos, ChangeLogin, DeleteUser, RegisterUser
from django.contrib.auth.views import LoginView, LogoutView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView


urlpatterns = [
    path('register/', RegisterUser, name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('userinfo/', Get_my_infos, name='userinfo'),
    path('userinfo/<int:user_id>', Get_user_infos, name='userinfo'),
    path('newlogin/', ChangeLogin, name='change login'),
    path('deleteuser/', DeleteUser, name='delete user'),
]
