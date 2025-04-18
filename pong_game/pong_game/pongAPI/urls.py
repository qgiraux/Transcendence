from django.contrib import admin
from django.urls import path, include

from pong.views import pong_view, pong_test

import logging

logger = logging.getLogger(__name__)

def view500(request):
    logger.debug(f"[pong_game.urls] {request}")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('pong.urls')),
]

handler500=view500