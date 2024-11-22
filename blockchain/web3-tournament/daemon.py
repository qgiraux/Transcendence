from solcx import install_solc, compile_source
from web3 import Web3
import json
import os
import os.path

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

#File-json
def _save_contract(address, abi, est_gas, jsonFile):
	_writefile(jsonFile, json.dumps({"address":address, "abi":abi, "est_gas":est_gas}))

def _load_contract(jsonFile):
	d = json.loads(_readfile(jsonFile))
	return d["address"], d["abi"], d["est_gas"]

#contract
def _transact_contract(sourceName, w3):
	source = _readfile(sourceName)
	assert "" != source
	install_solc(version='latest')
	compiled_sol = compile_source(source, output_values=['abi', 'bin'], optimize=True, optimize_runs=10)
	contract_id, contract_interface = compiled_sol.popitem()
	bytecode = contract_interface['bin']
	abi = contract_interface['abi']
	contract = w3.eth.contract(abi=abi, bytecode=bytecode)
	est_gas = contract.constructor().estimate_gas()
	tx_hash = contract.constructor().transact()
	tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
	return tx_receipt.contractAddress, abi, est_gas

def _getContract(sourceFile, jsonFile, w3):
	if (True == os.path.isfile(jsonFile)):
		print(f"daemon.py: info: {sourceFile}: already transacted, remove: {jsonFile} to change provider")
		address, abi, est_gas = _load_contract(jsonFile)
	else:
		address, abi, est_gas = _transact_contract(sourceFile, w3)
		_save_contract(address, abi, est_gas, jsonFile)
	print(f"daemon.py: info: {sourceFile}: estimated gas: {est_gas} address:{address} abi:\n{abi} ")
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

def _storeTournament(cupName, value, contract, w3):
	try:
		_tx_hash = contract.functions.storeTournament(_to_byte32(cupName), str(value)).transact()
		_tx_receipt = w3.eth.wait_for_transaction_receipt(_tx_hash)
	except Exception as e:
		print("storeTournament: error: cupName: `{cupName}`: ", e)
	return

def _getTournament(cupName, contract):
	_results = ""
	try:
		_results = contract.functions.getTournament(_to_byte32(cupName)).call()
	except Exception as e:
		print("getTournament: error: cupName: `{cupName}`: ", e)
	return _results

#Provider
def _getWeb3(useTesterProvider, jsonFile):
	if (useTesterProvider or 1):
		print("daemon.py: info: currently using EthereumTesterProvider")
		if (True == os.path.isfile(jsonFile)):
			os.remove(jsonFile)
		provider = Web3.EthereumTesterProvider() #This leaks fd
		w3 = Web3(provider)
		w3.eth.default_account = w3.eth.accounts[0]
	return w3

## Main

def main():
	JSON_FILE = "/tournament.json"
	w3 = _getWeb3(True, JSON_FILE)
	tournament = _getContract("/Tournament.sol", JSON_FILE, w3)

	_storeTournament("Cup", "potato", tournament, w3)
	_storeTournament("Cup", "potatox", tournament, w3)

	print(_getTournament("Cup", tournament))
	print(_getTournament("Cup1", tournament))

if __name__ == '__main__':
	main()
