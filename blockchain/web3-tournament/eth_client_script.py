# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    eth_client_script.py                               :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:13:31 by jerperez          #+#    #+#              #
#    Updated: 2024/11/22 17:46:50 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from daemon import get_provider, Provider, load_contract, JSON_FILE, do_stuff_async
from web3 import Web3, AsyncWeb3
import os
import asyncio

## Main
# def _check_env():

def _info(s):
	print("eth_client_script: info: " + s)

def _error(s):
	print("eth_client_script: error: " + s)

async def main():
	_info("querying daemon.js for connection parameters...")
	provider = get_provider()
	if ((Provider.WS == provider)):
		_info("sected WS provider.")
		w3 = await AsyncWeb3(AsyncWeb3.WebSocketProvider('ws://ethereum-testnet:8546'))
	else :
		_error("Connection forbidden.")
		return
	_info("Connection Success")
	address, abi, est_gas = load_contract(JSON_FILE)
	tournament = w3.eth.contract(
		address=address,
		abi=abi
	)
	_info("Contract Ready")
	await do_stuff_async(tournament, w3)
	# GETH_NODEKEYHEX = os.environ.get('GETH_NODEKEYHEX', '')
	# if ('' == GETH_NODEKEYHEX):
	# 	_error("no node to conect to.")
	
	# _info(f"eth_client_script: info: attempting to connect to 0x{GETH_NODEKEYHEX}")
	# _info(web3.geth.admin.add_peer('enode://' + GETH_NODEKEYHEX + '@ethereum-testnet:30303'))

if __name__ == '__main__':
	asyncio.run(main())
