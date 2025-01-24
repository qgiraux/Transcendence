import sys
import json
import logging
#
import rest_framework.decorators
import rest_framework.response
import rest_framework.permissions
import adrf.decorators
from django.views.decorators.csrf import requires_csrf_token
#
sys.path.insert(0, "/")
import Interface

logger = logging.getLogger(__name__)

@adrf.decorators.api_view(["GET", "POST"])
def view404(request, exception):
	return rest_framework.response.Response(
		{"detail":f"The princess is in another castle. {exception}"},
		status=rest_framework.status.HTTP_404_NOT_FOUND
	)

async def _destroy_interface(interface, p_interface_):
	if (interface is None and p_interface_ is not None):
		await p_interface_.destroy()

async def _get_interface(interface):
	if (interface is None):
		p_interface_ = Interface.ContractInterface()
		p_interface_.save_json = True
		await p_interface_.initialize()
	else:
		p_interface_ = interface
	return p_interface_

@adrf.decorators.api_view(["GET"])
async def get_address(request, interface=None):
	p_interface_ = None
	try:
		p_interface_ = await _get_interface(interface)
	except Exception as e:
		await _destroy_interface(interface, p_interface_)
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)
	await _destroy_interface(interface, p_interface_)
	return rest_framework.response.Response({"address":interface.getAddress()})

@adrf.decorators.api_view(["GET"])
async def get_score(request, name, interface=None):
	p_interface_ = None
	try:
		p_interface_ = await _get_interface(interface)
		tournament = await interface.getScore(name) #
	except Interface.ContractInterface.UnknownName as e:
		await _destroy_interface(interface, p_interface_)
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_404_NOT_FOUND
		)
	except Exception as e:
		await _destroy_interface(interface, p_interface_)
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)
	serializer = interface.TournamentSerializer(tournament) #
	await _destroy_interface(interface, p_interface_)
	return rest_framework.response.Response(serializer.data)


@adrf.decorators.api_view(["POST"])
async def set_score(request, interface=None):
	p_interface_ = None
	try:
		p_interface_ = await _get_interface(interface)
		name = request.data["name"]
		receipt = json.loads(await p_interface_.setScore(name, request.data["result"]))
	except Exception as e:
		await _destroy_interface(interface, p_interface_)
		return rest_framework.response.Response(
			{"detail":str(e)},
			status=rest_framework.status.HTTP_400_BAD_REQUEST
		)
	await _destroy_interface(interface, p_interface_)
	return rest_framework.response.Response(
		{"name":name, "receipt":receipt},
		status=rest_framework.status.HTTP_201_CREATED
	)
