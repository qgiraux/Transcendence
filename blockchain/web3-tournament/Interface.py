# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Interface.py                                       :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/12/11 12:27:58 by jerperez          #+#    #+#              #
#    Updated: 2024/12/15 14:41:16 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import logging
import sys
import json
#
import hexbytes
import rest_framework.serializers
#import adrf.serializers
#
sys.path.insert(0, "/contract") #ugly
import AsyncWeb3
import Deploy
import Tournament
import Verify

logger = logging.getLogger(__name__)

#https://github.com/ethereum/web3.py/issues/782
class HexJsonEncoder(json.JSONEncoder):
	def default(self, obj):
		if isinstance(obj, hexbytes.HexBytes):
			return obj.hex()
		return super().default(obj)

class ContractInterface:
	""" Interfaces with blockchain contract 
	```Python
	interface = ContractInterface()
	await interface.initialize() #Connects to blockchain
	await interface.setScore("MyCup", "MyCupResult")
	print(await interface.getScore("MyCup"))
	```
	"""
	class Tournament:
		""" Tournament Class
		```Python
		t = ContractInterface.Tournament("MyCup", "MyCupResult")
		print(t.name) #"MyCup"
		print(t.result) #"MyCupResult"
		print(t) #"score[`MyCup`]=`MyCupResult`"
		```
		"""
		def __init__(self, name: str, result : str):
			self.name = name
			self.result = result
		def __str__(self):
			return f"score[`{self.name}`]=`{self.result}`"

	class TournamentSerializer(rest_framework.serializers.Serializer):
		""" Django serializer for `Tournament` Class"""
		name = rest_framework.serializers.CharField(max_length=32)
		result = rest_framework.serializers.CharField()

	class UnknownName(Exception):
		def __init__(self, name):
			super().__init__(f"unknown tournament name: {name}")

	class BadNameLength(Exception):
		def __init__(self, length):
			super().__init__(f"name incorrect length: {length}, expected 1 to 32")

	class BadResultLength(Exception):
		def __init__(self, length):
			super().__init__(f"result incorrect length: {length}, expected >0")

	class Leak(Exception):
		pass

	def _check_name(self, name):
		len_ = len(bytes(name, 'utf-8'))
		if (0 == len_ or 32 < len_):
			raise self.BadNameLength(len_)

	def _check_result(self, result):
		len_ = len(bytes(result, 'utf-8'))
		if (0 == len_):
			raise self.BadResultLength(len_)

	def __init__(self):
		self.initialized = False
		self.save_json = True
		self.contract_address = ""
		self._contract = None
		self._w3 = None

	async def _deploy_contract(self):
		if (True == self.save_json):
			self._contract = await Deploy.get_contract(self._w3)
		else:
			self._contract = await Deploy.get_contract(self._w3, "")
		self.contract_address = str(self._contract.address)

	async def _fix(self):
		if (False == self.initialized):
			await self.initialize()
		if (None == self._contract):
			await self._deploy_contract()

	async def initialize(self):
		""" Connects to Blockchain
		``` Python
		interface = ContractInterface()
		print(interface.initialized) #False
		await interface.initialize()
		print(interface.initialized) #True
		Raises:
			Exception - In case something happen
		```
		"""
		if (True == self.initialized):
			return
		self._w3 = await AsyncWeb3.initialize_web3()
		await self._deploy_contract()
		self.initialized = True

	def removeContract(self):
		""" Removes Contract Files """
		Deploy.forget_contract()
		self._contract = None
		self.contract_address = ""

	def getAddress(self) -> str:
		""" Gets smart contract address"""
		return self.contract_address

	async def getScore(self, name : str) -> Tournament:
		""" Gets tournament score
		Raises:
			Exception - In case something happen
		"""
		logger.info(f"getScore['{name}']")
		self._check_name(name)
		await self._fix()
		result = await Tournament.get_score(name, self._contract, True)
		if ("" == result):
			raise self.UnknownName(name)
		return self.Tournament(name, result)
	
	async def setScore(self, name : str, result: str) -> str:
		""" Sets tournament score
		Raises:
			Exception - In case something happen
		"""
		logger.info(f"setScore['{name}']='{result}'")
		self._check_name(name)
		self._check_result(result)
		await self._fix()
		receipt = await Tournament.store_tournament_async(name, result, self._contract, self._w3, True)
		return json.dumps(receipt, cls=HexJsonEncoder)
	
	async def destroy(self):
		if (self._w3 is not None):
			await AsyncWeb3.disconnect(self._w3)
			self._w3 = None

	async def verify_contract(self):
		if ("" != self.contract_address):
			return await Verify.verify_transact(self.contract_address, self._w3)
		return 1

	def __del__(self):
		if (self._w3 is not None):
			#logger.warning(f"interface was not destroyed properly, use `await interface.destroy()`")
			raise self.Leak(f"interface was not destroyed properly, use `await interface.destroy()`") #TODO

async def main():
	""" Sets score['Cup']='Patate' then gets score['Cup'] """
	logging.basicConfig(level=logging.INFO)
	interface = ContractInterface()
	await interface.initialize()
	logger.info(f"address: {interface.getAddress()}")
	logger.info(f"{await interface.setScore("Cup", "Patate")}")
	logger.info(f"{await interface.getScore("Cup")}")
	await interface.destroy()

if __name__ == '__main__':
	import asyncio
	asyncio.run(main())
