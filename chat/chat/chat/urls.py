from django.urls import path, include
from chat import views as chat_views
from django.contrib.auth.views import LoginView, LogoutView
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def custom_login_redirect(request):
    return redirect("http://127.0.0.1:8001/login")
@csrf_exempt
def custom_logout_redirect(request):
    return redirect("http://127.0.0.1:8001/logout")

urlpatterns = [
    path("", chat_views.chatPage, name="chat-page"),

    # login-section
    path("auth/login/", custom_login_redirect, name="login-user"),
    path("auth/logout/", custom_logout_redirect, name="logout-user"),
]