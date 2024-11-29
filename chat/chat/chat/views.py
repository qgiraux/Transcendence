# Create your views here.
from django.shortcuts import render, redirect
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import permission_classes
from django.http import HttpResponse

@permission_classes([IsAuthenticated])
def chatPage(request, *args, **kwargs):
    # if not request.user.is_authenticated:
    #     return HttpResponse('Unauthorized', status=401)
    context = {}
    return render(request, "chat/chatPage.html", context)