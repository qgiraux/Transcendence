from django.urls import path, re_path
from .views import (
    UserListView,
    Get_my_infos,
    Get_user_infos,
    ChangeLogin,
    RegisterUser,
    ChangeNickname,
    ChangeLanguage,
    CheckUserStatus,
    get_jwt_token, GetAllUsers,
    Enable_Twofa,
    Get_user_stats,
    Add_user_stats,
    Get_user_id,
    ChangePassword,
    refresh_jwt_token,
    UserDeleteView,
    authenticate_with_2fa,
    TOTPCreateView
    )

from django.contrib.auth.views import LoginView, LogoutView
from rest_framework_simplejwt.views import TokenRefreshView



urlpatterns = [
    path('register/', RegisterUser, name='register'),
    path('login/', get_jwt_token, name='login'),
    path('logintwofa/', authenticate_with_2fa, name='login'),
    path('enable_twofa/', Enable_Twofa, name='enable twofa'),
    path('refresh/', refresh_jwt_token, name='token_refresh'),
    path('userinfo/', Get_my_infos, name='myuserinfo'),
    path('userid/', Get_user_id, name='get user id'),
    path('userinfo/<int:user_id>', Get_user_infos, name='userinfo'),
    path('userstats/<int:user_id>', Get_user_stats, name='get user stats'),
    path('adduserstats/<int:user_id>', Add_user_stats, name='add user stats'),
    path('newlogin/', ChangeLogin, name='change login'),
    path('newnickname/', ChangeNickname, name='change nickname'),
    path('newpassword/', ChangePassword, name='change password'),
    path('deleteuser/', UserDeleteView.as_view(), name='delete user'),
    path('userstatus/<int:user_id>', CheckUserStatus, name='check user status'),
    path('userlist/', GetAllUsers, name='user list'),
    path('lang/', ChangeLanguage, name='change language'),


    path('totp/create/', TOTPCreateView.as_view(), name='totp-create'),
    # re_path(r'totp/login/(?P<token>[0-9]{6})/', TOTPVerifyView.as_view(), name='totp-login'),

]

# Example of calling reverse with user_id=10
# url = reverse('userinfo', kwargs={'user_id': 10})
# print(url)
