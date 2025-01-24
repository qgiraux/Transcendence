import sys
import logging
#
import rest_framework.test
import rest_framework.status
import django.urls
import django.http
import asyncio
import adrf.requests
import rest_framework.request
import django.core.handlers.asgi
import django.test
#
from .views import get_score, set_score, get_address
#
sys.path.insert(0, "/")
import Interface
#

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

async def _test_post_get(arf, name, result, interface):
	post_request = arf.post("/score/", {"name": name, "result": result})
	response = await set_score(post_request, interface)
	assert(response.status_code == rest_framework.status.HTTP_201_CREATED)
	assert(response.data["name"] == name)
	response.data["receipt"]
	get_request = arf.get(f"/score/{name}/")
	response = await get_score(get_request, name, interface)
	assert(response.data["name"] == name)
	assert(response.data["result"] == result)
	assert(response.status_code == rest_framework.status.HTTP_200_OK)
	get_request = arf.get(f"/contract/address/")
	response = await get_address(get_request, interface)
	assert(response.status_code == rest_framework.status.HTTP_200_OK)
	assert("" != response.data["address"])

class SerializerTest(rest_framework.test.APITestCase):
	def setUp(self):
		"""Set up the test environment."""
		interface = Interface.ContractInterface()
		interface.removeContract()
		self._arf = django.test.AsyncRequestFactory()

	def test_class_works(self):
		name = "MyCup"
		result = "MyResult"
		interface = Interface.ContractInterface()
		tournament = interface.Tournament(name, result)
		self.assertEqual(False, interface.initialized)
		self.assertEqual(name, tournament.name)
		self.assertEqual(result, tournament.result)
	
	def test_serializer_works(self):
		name = "MyCup"
		result = "MyResult"
		interface = Interface.ContractInterface()
		tournament = interface.Tournament(name, result)
		serializer = interface.TournamentSerializer(tournament)
		self.assertEqual(False, interface.initialized)
		self.assertEqual(name, serializer.data["name"])
		self.assertEqual(result, serializer.data["result"])

	async def test_post_simple(self):
		async_request_factory = self._arf
		#
		name = "MyCup"
		result = "MyResult"
		interface = Interface.ContractInterface()
		interface.removeContract()
		#
		post_request = async_request_factory.post("/score/", {"name": name, "result": result})
		response = await set_score(post_request, interface)
		self.assertEqual(response.status_code, rest_framework.status.HTTP_201_CREATED)
		await interface.destroy()

	async def test_post_simple_interface(self):
		async_request_factory = self._arf
		#
		name = "MyCup"
		result = "MyResult"
		interface = Interface.ContractInterface()
		interface.removeContract()
		self.assertEqual(False, interface.initialized)
		#
		post_request = async_request_factory.post("/score/", {"name": name, "result": result})
		response = await set_score(post_request, None)
		self.assertEqual(response.status_code, rest_framework.status.HTTP_201_CREATED)
		await interface.destroy()

	async def test_all_simple(self):
		async_request_factory = self._arf
		#
		name = "MyCup"
		result = "MyResult"
		interface = Interface.ContractInterface()
		interface.removeContract()
		await _test_post_get(async_request_factory, name, result, interface)
		await interface.destroy()

	async def test_valid_short_name(self):
		async_request_factory = self._arf
		##
		name = "M"
		result = "M"
		interface = Interface.ContractInterface()
		interface.removeContract()
		await _test_post_get(async_request_factory, name, result, interface)
		await interface.destroy()

	async def test_valid_long_name(self):
		##
		name = "01234567890123456789012345678901"
		result = "M"
		interface = Interface.ContractInterface()
		interface.removeContract()
		await _test_post_get(self._arf, name, result, interface)
		await interface.destroy()
	
	async def test_invalid_long_name(self):
		async_request_factory = self._arf
		##
		name = "012345678901234567890123456789011" #too long 1
		result = "M"
		interface = Interface.ContractInterface()
		interface.removeContract()
		post_request = async_request_factory.post("/score/", {"name": name, "result": result})
		response = await set_score(post_request, interface)
		assert(response.status_code != rest_framework.status.HTTP_201_CREATED)
		await interface.destroy()

	async def test_invalid_long_name(self):
		async_request_factory = self._arf
		##
		name = "0123456789012345678901234567890大" #too long 2
		result = "M"
		interface = Interface.ContractInterface()
		interface.removeContract()
		post_request = async_request_factory.post("/score/", {"name": name, "result": result})
		response = await set_score(post_request, interface)
		assert(response.status_code != rest_framework.status.HTTP_201_CREATED)
		await interface.destroy()

	async def test_invalid_short_result(self):
		async_request_factory = self._arf
		##
		name = "MyCup"
		result = "" #too short
		interface = Interface.ContractInterface()
		interface.removeContract()
		post_request = async_request_factory.post("/score/", {"name": name, "result": result})
		response = await set_score(post_request, interface)
		assert(response.status_code != rest_framework.status.HTTP_201_CREATED)
		await interface.destroy()

	async def test_invalid_post_twice(self):
		async_request_factory = self._arf
		##
		name = "MyCup"
		result = "MyResult"
		interface = Interface.ContractInterface()
		interface.removeContract()
		#
		post_request = async_request_factory.post("/score/", {"name": name, "result": result})
		response = await set_score(post_request, interface)
		self.assertEqual(response.status_code, rest_framework.status.HTTP_201_CREATED)
		post_request = async_request_factory.post("/score/", {"name": name, "result": result}) # double
		response = await set_score(post_request, interface)
		assert(response.status_code != rest_framework.status.HTTP_201_CREATED)
		await interface.destroy()

	async def test_invalid_get_404(self):
		async_request_factory = self._arf
		##
		name = "MyCup"
		interface = Interface.ContractInterface()
		interface.removeContract()
		get_request = async_request_factory.get(f"/score/{name}/") # do not exists
		response = await get_score(get_request, name, interface)
		assert(response.status_code == rest_framework.status.HTTP_404_NOT_FOUND)
		await interface.destroy()

	async def test_invalid_get_name(self):
		async_request_factory = self._arf
		##
		name = ""
		interface = Interface.ContractInterface()
		interface.removeContract()
		get_request = async_request_factory.get(f"/score/{name}/") # bad
		response = await get_score(get_request, name, interface)
		assert(response.status_code == rest_framework.status.HTTP_400_BAD_REQUEST)
		await interface.destroy()
	
	async def test_get_address(self):
		async_request_factory = self._arf
		##
		interface = Interface.ContractInterface()
		interface.removeContract()
		await interface.initialize()
		get_request = async_request_factory.get(f"/contract/address/")
		response = await get_address(get_request, interface)
		assert(response.status_code == rest_framework.status.HTTP_200_OK)
		address = response.data["address"]
		assert("" != address)
		await interface.destroy()

	async def test_get_address_twice_same(self):
		async_request_factory = self._arf
		##
		interface = Interface.ContractInterface()
		interface.removeContract()
		await interface.initialize()
		get_request = async_request_factory.get(f"/contract/address/")
		response = await get_address(get_request, interface)
		assert(response.status_code == rest_framework.status.HTTP_200_OK)
		address = response.data["address"]
		assert("" != address)
		get_request = async_request_factory.get(f"/contract/address/")
		response = await get_address(get_request, interface)
		assert(response.status_code == rest_framework.status.HTTP_200_OK)
		assert(address == response.data["address"])
		await interface.destroy()

	async def test_get_address_twice_diff(self):
		async_request_factory = self._arf
		##
		interface = Interface.ContractInterface()
		interface.removeContract()
		await interface.initialize()
		#
		get_request = async_request_factory.get(f"/contract/address/")
		response = await get_address(get_request, interface)
		assert(response.status_code == rest_framework.status.HTTP_200_OK)
		address = response.data["address"]
		assert("" != address)
		await interface.destroy()
		#
		interface = Interface.ContractInterface()
		interface.removeContract()
		await interface.initialize()
		#
		get_request = async_request_factory.get(f"/contract/address/")
		response = await get_address(get_request, interface)
		assert(response.status_code == rest_framework.status.HTTP_200_OK)
		assert("" != response.data["address"])
		assert(address != response.data["address"])
		await interface.destroy()
