# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Utils.py                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2025/01/20 11:26:57 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import json
import os
import logging

JSON_FILE = "/tournament.json"

logger = logging.getLogger(__name__)

#File
def readfile(filename):
	if (False == os.path.isfile(filename)):
		return ""
	_f = open(filename, "r")
	_ret = _f.read()
	_f.close()
	logger.info(f"read {filename}")
	return _ret

def writefile(filename, content):
	_f = open(filename, "w")
	_f.write(content)
	_f.close()
	logger.info(f"wrote {filename}")

#File-json
def save_contract(address : str, metadata : str, jsonFile = JSON_FILE):
	""" Saves `contract` `address` and `metadata` in `jsonFile`"""
	writefile(jsonFile, json.dumps({"address":address, "metadata":metadata}))

def load_contract(jsonFile=JSON_FILE):
	""" Loads `contract` `address` and `metadata` from `jsonFile`"""
	d = json.loads(readfile(jsonFile))
	return d["address"], d["metadata"]

#
def get_abi_from_metadata(metadata : str):
	""" Gets `abi` from `metadata`"""
	return json.loads(metadata)["output"]["abi"]


def get_contract_from_json(web3_ : any, jsonFile=JSON_FILE) -> any:
	"""Gets contract from JSON"""
	address, metadata = load_contract(jsonFile)
	return web3_.eth.contract(
		address=address,
		abi=get_abi_from_metadata(metadata)
	)

def main():
	pass

if __name__ == '__main__':
	main()
