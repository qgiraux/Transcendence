# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    daemon.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2024/11/26 15:59:35 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from solcx import install_solc, compile_source
from web3 import Web3, AsyncWeb3
from eth_account import Account
from eth_account.signers.local import LocalAccount
from web3.middleware import SignAndSendRawMiddlewareBuilder
import re
from enum import Enum
import json
import os
import os.path
import asyncio

JSON_FILE = "/tournament.json"
ADDRESSES_JSON = "/data/addresses.json"
KEYSTORE="/data/keystore/"

class Provider(Enum):
    TEST = 0
    WS = 1

#print
def _info(s):
	print("daemon: info: " + s)

def _error(s):
	print("daemon: error: " + s)

#File
def _readfile(filename):
	if (False == os.path.isfile(filename)):
		return ""
	_f = open(filename, "r")
	_ret = _f.read()
	_f.close()
	return _ret

def _writefile(filename, content):
	_f = open(filename, "w")
	_f.write(content)
	_f.close()


def get_private_key(publickey, password, w3):
	dirs=os.listdir(KEYSTORE)
	r = '(?i)' + publickey + '$'
	for d in dirs:
		file = os.path.join(KEYSTORE, d)
		if os.path.isfile(file) and bool(re.search(r, file)):
			encrypted = _readfile(file)
			return w3.eth.account.decrypt(encrypted, password)
	return ''


#File-json
def _save_contract(address, abi, est_gas, jsonFile):
	_writefile(jsonFile, json.dumps({"address":address, "abi":abi, "est_gas":est_gas}))

def load_contract(jsonFile):
	d = json.loads(_readfile(jsonFile))
	return d["address"], d["abi"], d["est_gas"]

def get_public_address(num):
	d = json.loads(_readfile(ADDRESSES_JSON))
	return d["addresses"][num]

#contract
async def _transact_contract(sourceName, w3):
	source = _readfile(sourceName)
	assert "" != source
	install_solc(version='latest')
	compiled_sol = compile_source(source, output_values=['abi', 'bin'], optimize=True, optimize_runs=10)
	contract_id, contract_interface = compiled_sol.popitem()
	bytecode = contract_interface['bin']
	abi = contract_interface['abi']
	contract = w3.eth.contract(abi=abi, bytecode=bytecode)
	est_gas = 0 #await contract.constructor().estimate_gas()
	tx_hash = await contract.constructor().transact()
	tx_receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)
	return tx_receipt.contractAddress, abi, est_gas

async def _getContract(sourceFile, jsonFile, w3):
	if (True == os.path.isfile(jsonFile)):
		_info(f"{sourceFile}: already transacted, remove: {jsonFile} to change provider")
		address, abi, est_gas = load_contract(jsonFile)
	else:
		address, abi, est_gas = await _transact_contract(sourceFile, w3)
		_save_contract(address, abi, est_gas, jsonFile)
	_info(f"{sourceFile}: estimated gas: {est_gas} address:{address} abi:\n{abi} ")
	return w3.eth.contract(
		address=address,
		abi=abi
	)

#contract-functions
def _to_byte32(value):
	ret = bytearray(32)
	bvalue = bytearray(str(value), "utf-8")
	n = len(bvalue)
	i = 0
	while (i < 32 and i < n):
		ret[i] = bvalue[i]
		i += 1
	return ret

def _store_tournament(cupName, value, contract, w3):
	try:
		_tx_hash = contract.functions.storeTournament(_to_byte32(cupName), str(value)).transact()
		_tx_receipt = w3.eth.wait_for_transaction_receipt(_tx_hash)
	except Exception as e:
		print(f"storeTournament: error: cupName: `{cupName}`: ", e)
	return

async def store_tournament_async(cupName, value, contract, w3):
	try:
		_tx_hash = contract.functions.storeTournament(_to_byte32(cupName), str(value)).transact()
		_tx_receipt = await w3.eth.wait_for_transaction_receipt(_tx_hash)
	except Exception as e:
		print(f"storeTournament: error: cupName: `{cupName}`: ", e)
	return

def _get_tournament(cupName, contract):
	_results = ""
	try:
		_results = contract.functions.getTournament(_to_byte32(cupName)).call()
	except Exception as e:
		print(f"getTournament: error: cupName: `{cupName}`: ", e)
	return _results

async def get_tournament_async(cupName, contract):
	_results = ""
	try:
		_results = await contract.functions.getTournament(_to_byte32(cupName)).call()
	except Exception as e:
		print(f"getTournament: error: cupName: `{cupName}`: ", e)
	return _results

#Provider
def get_provider():
	#TODO: use env
	tester = os.environ.get('ETH_PROVIDER', 'TEST')
	_info(f"ETH_PROVIDER={tester}")
	if ('WS' == tester):
		_error("WS not supported")
		return Provider.WS
	_info("currently using EthereumTesterProvider")
	return Provider.TEST

async def _get_web3(jsonFile):
	provider = get_provider()
	if (Provider.TEST == provider):
		if (True == os.path.isfile(jsonFile)):
			os.remove(jsonFile)
		provider = Web3.EthereumTesterProvider() #This leaks fd
		w3 = Web3(provider)
		w3.eth.default_account = w3.eth.accounts[0]
	elif (Provider.WS == provider):
		w3 = await AsyncWeb3(AsyncWeb3.WebSocketProvider('ws://ethereum-testnet:8546')) #TODO: select account
		#w3.eth.getAccounts() #??
		private_key = get_private_key(get_public_address(0), 'pass', w3)
		account = w3.eth.account.from_key(private_key)
		w3.middleware_onion.inject(SignAndSendRawMiddlewareBuilder.build(account), layer=0)
		#print(account.address)
		w3.eth.default_account = account.address #w3.to_checksum_address(get_public_address(0)) #'0x0000000000000000000000000000000000000001' #w3.eth.accounts.create()
		#print("accounts:", await w3.eth.accounts)
		# account: LocalAccount = Account.from_key('0x0000000000000000000000000000000000000000000000000000000000000001') #0000000000000000000000000000000000000000000000000000000000000001
		# w3.middleware_onion.inject(SignAndSendRawMiddlewareBuilder.build(account), layer=0)
		# print(f"Your hot wallet address is {account.address}")
	_info(f"default_account: {w3.eth.default_account}")
	return w3

def _do_stuff(contract, w3):
	_store_tournament("Cup", "potato", contract, w3)
	_store_tournament("Cup", "potatox", contract, w3)
	print(_get_tournament("Cup", contract))
	print(_get_tournament("Cup1", contract))

async def do_stuff_async(contract, w3):
	await store_tournament_async("Cup", "potato", contract, w3)
	await store_tournament_async("Cup", "potatox", contract, w3)
	print(await get_tournament_async("Cup", contract))
	print(await get_tournament_async("Cup1", contract))

## Main
async def main():
	w3 = await _get_web3(JSON_FILE)
	tournament = await _getContract("/Tournament.sol", JSON_FILE, w3)
	await do_stuff_async(tournament, w3) #do async
	# while (1):
	# 	pass

if __name__ == '__main__':
	asyncio.run(main())
