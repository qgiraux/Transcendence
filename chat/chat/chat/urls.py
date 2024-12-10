from django.urls import path, include
from .views import TestView
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt


urlpatterns = [
    path('test/', TestView.as_view(), name='ctest'),
]