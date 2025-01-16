#from django import path, include
import django
#import rest_framework
from .views import get_ipfs_content, get_contract_address, deploy_contract

urlpatterns = [
	django.urls.path('ipfs/<str:cid>/', get_ipfs_content, name='get_ipfs_content'),
	django.urls.path('address/', get_contract_address, name='get_contract_address'),
	django.urls.path('deploy/', deploy_contract, name='deploy_contract'),
]
