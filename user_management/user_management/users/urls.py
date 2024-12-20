from django.urls import path, re_path
from .views import UserListView, Get_my_infos, Get_user_infos, ChangeLogin, DeleteUser, RegisterUser, ChangeNickname, CheckUserStatus, get_jwt_token, GetAllUsers, Enable_Twofa
from django.contrib.auth.views import LoginView, LogoutView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import TOTPCreateView, TOTPVerifyView



urlpatterns = [
    path('register/', RegisterUser, name='register'),
    path('login/', get_jwt_token, name='login'),
    path('enable_twofa/', Enable_Twofa, name='enable twofa'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('userinfo/', Get_my_infos, name='myuserinfo'),
    path('userinfo/<int:user_id>', Get_user_infos, name='userinfo'),
    path('newlogin/', ChangeLogin, name='change login'),
    path('newnickname/', ChangeNickname, name='change nickname'),
    path('deleteuser/', DeleteUser, name='delete user'),
    path('userstatus/<int:user_id>', CheckUserStatus, name='check user status'),
    path('userlist/', GetAllUsers, name='user list'),

    path('totp/create/', TOTPCreateView.as_view(), name='totp-create'),
    re_path(r'totp/login/(?P<token>[0-9]{6})/', TOTPVerifyView.as_view(), name='totp-login'),
    

]

# Example of calling reverse with user_id=10
# url = reverse('userinfo', kwargs={'user_id': 10})
# print(url)
