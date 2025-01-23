import sys
import logging
import json
#
import rest_framework.decorators
import adrf.decorators
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

from .models import Contract

#from django.shortcuts import get_object_or_404

def _initalize_db():
	address, abi = Interface.ContractInterface.get_contract_info()
	contract = Contract.objects.create(address=address, abi=abi)
	contract.save()
	return address, abi

# @rest_framework.decorators.api_view(["GET"])
# def get_ipfs_content(request, cid):
# 	ipfs = django.shortcuts.get_object_or_404(Ipfs, cid=cid) 
# 	return rest_framework.response.Response({"content": ipfs.content}) 

@rest_framework.decorators.api_view(["GET"])
def get_contract(request):
	try:
		count = Contract.objects.count()
		if (0 == count):
			address, abi = _initalize_db()
			return rest_framework.response.Response({"abi": abi, "address": address})
		elif (1 == count):
			contract = Contract.objects.first()
			return rest_framework.response.Response({"abi": str(contract.abi), "address": str(contract.address)})
		return rest_framework.response.Response(
			{"detail": f"DB expected 0 or 1 address, received {count}"},
			status=rest_framework.status.HTTP_500_INTERNAL_SERVER_ERROR
		)
	except Exception as e:
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)

@rest_framework.decorators.api_view(["GET"])
def get_contract_abi(request):
	try:
		count = Contract.objects.count()
		if (0 == count):
			address, abi = _initalize_db()
			return rest_framework.response.Response({"abi": abi})
		elif (1 == count):
			contract = Contract.objects.first()
			return rest_framework.response.Response({"abi": contract.abi})
		return rest_framework.response.Response(
			{"detail": f"DB expected 0 or 1 address, received {count}"},
			status=rest_framework.status.HTTP_500_INTERNAL_SERVER_ERROR
		)
	except Exception as e:
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)

@rest_framework.decorators.api_view(["GET"])
def get_contract_address(request):
	try:
		count = Contract.objects.count()
		if (0 == count):
			address, abi = _initalize_db()
			return rest_framework.response.Response({"address": address})
		elif (1 == count):
			contract = Contract.objects.first()
			return rest_framework.response.Response({"address": str(contract.address)})
		return rest_framework.response.Response(
			{"detail": f"DB expected 0 or 1 address, received {count}"},
			status=rest_framework.status.HTTP_500_INTERNAL_SERVER_ERROR
		)
	except Exception as e:
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)


@adrf.decorators.api_view(["GET"])
async def get_score(request):
	try:
		name = request.data["name"]
		address = request.data["address"]
		abi = request.data["abi"]
		interface_ = Interface.ContractInterface()
		await interface_.initialize_from_contract_info(address, abi)
		result = await interface_.getScore(name)
	except Exception as e:
		await interface_.destroy()
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)
	await interface_.destroy()
	return rest_framework.response.Response({"name":name, "result":result})

@adrf.decorators.api_view(["POST"])
async def set_score(request):
	try:
		name = request.data["name"]
		result = request.data["result"]
		address = request.data["address"]
		abi = request.data["abi"]
		interface_ = Interface.ContractInterface()
		logger.info("interface") #
		await interface_.initialize_from_contract_info(address, abi)
		logger.info("setScore0") #
		receipt = json.loads(await interface_.setScore(name, result))
		logger.info("setScore1") #
	except Exception as e:
		await interface_.destroy()
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)
	await interface_.destroy()
	return rest_framework.response.Response(
		{"name":name, "receipt":receipt},
		status=rest_framework.status.HTTP_201_CREATED
	)
