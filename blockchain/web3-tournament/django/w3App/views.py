import sys
import logging
#
import rest_framework.decorators
#import adrf.decorators
import rest_framework.response
import rest_framework.permissions
import django
import asyncio


#
sys.path.insert(0, "/")
import Interface

logger = logging.getLogger(__name__)

# @adrf.decorators.api_view(["GET", "POST"])
# @rest_framework.decorators.permission_classes([rest_framework.permissions.AllowAny]) 
# def view404(request, exception):
# 	return rest_framework.response.Response(
# 		{"detail":f"The princess is in another castle. {exception}"},
# 		status=rest_framework.status.HTTP_404_NOT_FOUND
# 	)

# async def _destroy_interface(interface, p_interface_):
# 	if (interface is None and p_interface_ is not None):
# 		await p_interface_.destroy()

# async def _get_interface(interface):
# 	if (interface is None):
# 		p_interface_ = Interface.ContractInterface()
# 		p_interface_.save_json = True
# 		await p_interface_.initialize()
# 	else:
# 		p_interface_ = interface
# 	return p_interface_

from .models import Ipfs, Address, File

#from django.shortcuts import get_object_or_404

@rest_framework.decorators.api_view(["GET"])
@rest_framework.decorators.permission_classes([rest_framework.permissions.AllowAny]) 
def get_ipfs_content(request, cid):
	ipfs = django.shortcuts.get_object_or_404(Ipfs, cid=cid) 
	return rest_framework.response.Response({"content": ipfs.content}) 

@rest_framework.decorators.api_view(["GET"])
@rest_framework.decorators.permission_classes([rest_framework.permissions.AllowAny]) 
def get_contract_address(request):
	try:
		count = Address.objects.count()
		if (0 == count):
			return rest_framework.response.Response({"address": ""})
		elif (1 == count):
			return rest_framework.response.Response({"address": str(Address.objects.first())})
		raise AssertionError(f"Expected 0 or 1 address, received {count}")
	except Exception as e:
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)


#@rest_framework.decorators.permission_classes([rest_framework.permissions.AllowAny]) 
@rest_framework.decorators.api_view(["POST"])
def deploy_contract(request):
	hex_string="patate"
	try:
		count = Address.objects.count()
		if (0 != count):
			raise AssertionError(f"Expected 0 address, received {count}")
		interface_ = Interface.ContractInterface()

		asyncio.run(interface_.connect())
		#await interface_.connect()
		#await interface_.deploy_contract
		#await interface_.disconnect()
		hex_string = interface_.contract_address
		address = Address.objects.create(hex_string=contract_address)
		address.save()
	except Exception as e:
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)
	return rest_framework.response.Response(
		{"address":hex_string},
		status=rest_framework.status.HTTP_201_CREATED
	)
