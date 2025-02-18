import django
from .views import get_score, set_score, get_address, view404
#

urlpatterns = [
	django.urls.path("score/<str:name>/", get_score, name="get_score"),
	django.urls.path("score/", set_score, name="set_score"),
	django.urls.path("contract/address/", get_address, name="get_address"),
]

handler404=view404
#handler500=view500