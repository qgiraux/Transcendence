# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    urls.py                                            :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/01/20 11:17:43 by jerperez          #+#    #+#              #
#    Updated: 2025/01/23 11:06:51 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#from django import path, include
import django
#import rest_framework
from .views import get_contract_address, get_contract_abi, get_contract, get_score, set_score

urlpatterns = [
	#django.urls.path('ipfs/<str:cid>/', get_ipfs_content, name='get_ipfs_content'),
	django.urls.path("score/<str:name>/", get_score, name="get_score"),
	django.urls.path("score/", set_score, name="set_score"),
	django.urls.path('contract/address/', get_contract_address, name='get_contract_address'), #
	django.urls.path('contract/abi/', get_contract_abi, name='get_contract_abi'), #
	django.urls.path('contract/', get_contract, name='get_contract'), #
	django.urls.path("score/<str:name>/", get_score, name="get_score"),
	django.urls.path("score/", set_score, name="set_score"),
]
