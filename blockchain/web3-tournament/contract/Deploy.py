# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Deploy.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2024/12/15 12:05:46 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import os
import logging
#
import Utils
import Compile
import AsyncWeb3

SOLC_OUTPUT_JSON = "/solc_output.json"
JSON_FILE = "/tournament.json"

logger = logging.getLogger(__name__)

#contract
async def _transact_contract(solc_output_json : str, web3_ : any):
	""" Transact Contract"""
	bytecode, metadata = Compile.get_solc_output_from_json(solc_output_json)
	abi = Utils.get_abi_from_metadata(metadata)
	contract = web3_.eth.contract(abi=abi, bytecode=bytecode)
	_balance0 = await web3_.eth.get_balance(web3_.eth.default_account)
	_transaction = contract.constructor()
	tx_hash = await AsyncWeb3.transact(_transaction, _balance0, web3_)
	tx_receipt = await web3_.eth.wait_for_transaction_receipt(tx_hash)
	_balance1 = await web3_.eth.get_balance(web3_.eth.default_account)
	logger.info(f"transaction cost: {_balance0 - _balance1}")
	return tx_receipt.contractAddress, metadata

def get_contract_from_json(web3_ : any, jsonFile=JSON_FILE) -> any:
	"""Gets contract from JSON"""
	address, metadata = Utils.load_contract(jsonFile)
	return web3_.eth.contract(
		address=address,
		abi=Utils.get_abi_from_metadata(metadata)
	)

async def _deploy_contract(web3_ : any, solc_json=SOLC_OUTPUT_JSON, save_json=JSON_FILE):
	"""Gets contract from JSON"""
	address, metadata = await _transact_contract(solc_json, web3_)
	if ("" != save_json):
		Utils.save_contract(address, metadata, save_json)
	logger.info(f"contract address: {address}")
	return web3_.eth.contract(
		address=address,
		abi=Utils.get_abi_from_metadata(metadata)
	)

async def get_contract(web3_ : any, jsonFile = JSON_FILE) -> any:
	"""Deploys contract or gets it from `jsonFile`, returns contract"""
	if ("" != jsonFile and True == os.path.isfile(jsonFile)):
		return get_contract_from_json(web3_, jsonFile)
	return await _deploy_contract(web3_, SOLC_OUTPUT_JSON, jsonFile)

def forget_contract(jsonFile = JSON_FILE):
	"""Removes contract info"""
	if (True == os.path.isfile(jsonFile)):
		os.remove(jsonFile) 

async def main():
	"""Deploys contract"""
	import AsyncWeb3
	web3_ = await AsyncWeb3.initialize_web3()
	tournament = await get_contract(web3_, JSON_FILE)
	await web3_.provider.disconnect()

if __name__ == '__main__':
	import asyncio
	logging.basicConfig(level=logging.INFO)
	asyncio.run(main())
