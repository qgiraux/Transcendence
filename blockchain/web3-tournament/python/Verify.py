# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Verify.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2024/12/09 16:40:24 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import re
import json
import asyncio
import logging
#
import cbor2
#
import Utils

SOURCE_FILE = "/TournamentScores.sol"
SOLC_OUTPUT_JSON = "/solc_output.json"
SOLC_INPUT_JSON = "/solc_input.json"
JSON_FILE = "/tournament.json"
ORIGIN = "daemon"
WS_URL='ws://hardhat-network:8545'
BASE58="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

logger = logging.getLogger(__name__)

#encode/decode
def _base58_encode(num, buff=""):
	if (num < 58):
		return buff + BASE58[num]
	buff = _base58_encode(num // 58, buff)
	buff += BASE58[num % 58]
	return buff

def _decode_cbor(eth_code_bin, cbor_nhex=4):
	code_hex = eth_code_bin.hex()
	cbor_size = int(code_hex[-cbor_nhex:], 16)
	if (51 != cbor_size):
		logger.info(f"CBOR size:{cbor_size}")
	cbor_hex=code_hex[-(2 * cbor_size + cbor_nhex):-cbor_nhex]
	cbor = cbor2.loads(bytes.fromhex(cbor_hex))
	cbor_human = cbor
	cbor_human["ipfs"]=_base58_encode(int.from_bytes(cbor_human["ipfs"], "big"))
	version = int.from_bytes(cbor_human["solc"], "big")
	cbor_human["solc"]=f"{version // 256 // 256}.{(version // 256) % 256}.{version % 256}"
	return cbor_human

# Verify
def _get_metadata(ipfs):
	logger.info(f"metadata IPFS (from node bytecode): {ipfs}")
	if (True):
		logger.warning(f"using metadata local copy instead of IPFS")
	bytecode, metadata = Utils.get_solc_output_from_json(SOLC_OUTPUT_JSON)
	return metadata

def _get_source(ipfs):
	logger.info(f"source IPFS (from metadata): {ipfs}")
	if (True):
		logger.warning(f"using source local copy instead of IPFS")
	source = json.loads(Utils.readfile(SOLC_INPUT_JSON))["sources"]["TournamentScores"]["content"]
	return source

def _verify_bytecode(bytecode, source, metadata, version):
	code_hex = bytecode.hex()
	logger.info(f"received bytecode:`{code_hex}`")
	if (True):
		logger.warning(f"Manual verification needed to compare bytecode")

def _verify_sha3(sha3_source, sha3_meta):
	if (sha3_source == sha3_meta):
		logger.info(f"source SHA3 match: {sha3_meta}")
	else:
		logger.error(f"SHA3 do not match, source: {sha3_source}, metadata {sha3_meta}")

def _verify_versions(version_cbor, version_meta):
	cbor = re.findall(r'\d+', version_cbor)
	if (3 != len(cbor)):
		logger.error(f"CBOR solc version incorrect: {version_cbor}")
	meta = re.findall(r'\d+', version_meta)
	if (len(meta) < len(cbor)):
		logger.error(f"metadata solc version incorrect: {version_meta}")
	for i, v in enumerate(cbor):
		if (v != meta[i]):
			logger.error(f"version do not match: {version_cbor} (CBOR) and {version_meta} (mata)")
	logger.info(f"solc version: {version_meta}")

async def verify_transact(
		address : str, 
		web3_ : any, 
		contractName = "TournamentScores"
	):
	""" Verifies that `address` is 'contractName' address"""
	try:
		logger.info(f"Verifying code at {address} from Node...")
		if (False == web3_.is_address(address)):
			logger.error(f"Node returns {address} is not a valid address")
		code = await web3_.eth.get_code(address)
		cbor = _decode_cbor(code)
		version_cbor = cbor["solc"]
		metadata = _get_metadata(cbor["ipfs"])
		version_meta=json.loads(metadata)["compiler"]["version"]
		ipfs_source = json.loads(metadata)["sources"][contractName]["urls"][1]
		sha3_meta = hex(int(json.loads(metadata)["sources"][contractName]["keccak256"], 16))
		source = _get_source(ipfs_source)
		sha3_source = hex(int(web3_.keccak(text=source).hex(), 16))
		_verify_sha3(sha3_source, sha3_meta)
		_verify_bytecode(code, source, metadata, version_cbor)
		_verify_versions(version_cbor, version_meta)
	except Exception as e:
		logger.error(f"Verification failed: {e}")
	logger.info(f"Verification completed.")

async def main():
	import daemon
	web3_ = await daemon.initialize_web3(daemon.get_private_key_from_env()) #
	address, metadata = daemon.load_contract() #
	await verify_transact(address, web3_)

if __name__ == '__main__':
	asyncio.run(main())
