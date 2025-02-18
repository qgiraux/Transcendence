# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    AsyncWeb3.py                                       :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2025/02/18 09:57:08 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import os
import logging
#
import web3
import aiohttp

WS_URL='ws://hardhat-network:8545'
HTTP_URL='http://hardhat-network:8545' #HTTPProvider

ENV_ACCOUNT_SERVICE_KEY='ACCOUNT_SERVICE_KEY'
ENV_ACCOUNT_USER_KEY='ACCOUNT_USER_KEY'

logger = logging.getLogger(__name__)

class LowWallet(Exception):
	pass


#Check Transaction
def _info_price(wei):
	eth = wei * 10e-18
	dollar = eth * 4000.0
	logger.info(f"wei:{wei} ETH:{eth} USD:{dollar}")

async def _check_funds_transaction(transaction, balance, web3_ : web3.main.AsyncWeb3):
	_est_gas = await transaction.estimate_gas()
	_gas_price = await web3_.eth.gas_price
	_est_cost = _est_gas * _gas_price
	logger.info(f"Estimate cost: {_est_cost} / balance: {balance}")
	_info_price(_est_cost)
	if (balance < 1.1 * _est_gas * _gas_price):
		raise LowWallet(f"Estimate cost is too high")

async def transact(transaction, balance, web3_):
	""" Wrapper around transat """
	await _check_funds_transaction(transaction, balance, web3_)
	return await transaction.transact()

# Connect
def get_private_key_from_env(env_var=ENV_ACCOUNT_SERVICE_KEY) -> str:
	"""Gets private key value from environment"""
	private_key = os.environ.get(env_var, '')
	if ('' == private_key):
		logger.error("Private key not found in env") #
	return private_key

def hide_private_key(private_key : str, web3_ : web3.main.AsyncWeb3) -> str:
	""" Gets public address and saves `private_key` for payments"""
	account = web3_.eth.account.from_key(private_key)
	web3_.middleware_onion.inject(
		web3.middleware.SignAndSendRawMiddlewareBuilder.build(account), 
		layer=0
	)
	return account.address

async def initialize_web3(owner_private_key=get_private_key_from_env()) -> web3.main.AsyncWeb3: 
	"""Gets web3 ready for transaction """
	logger.info(f"owner payable address:{"*" * len(owner_private_key)}")
	#web3_ = await web3.AsyncWeb3(web3.AsyncWeb3.WebSocketProvider(WS_URL)) #uses signals :(
	
	web3_ = web3.AsyncWeb3(web3.AsyncWeb3.AsyncHTTPProvider(HTTP_URL))
	custom_session = aiohttp.ClientSession()
	await web3_.provider.cache_async_session(custom_session)

	web3_.eth.default_account = hide_private_key(owner_private_key, web3_)
	logger.info(f"owner public address: {web3_.eth.default_account}")
	return web3_

async def disconnect(web3_):
	await web3_.provider.disconnect()

async def main():
	"""Uploads contract"""
	web3_ = await initialize_web3()
	await web3_.provider.disconnect()

if __name__ == '__main__':
	logging.basicConfig(level=logging.INFO)
	import asyncio
	asyncio.run(main())
