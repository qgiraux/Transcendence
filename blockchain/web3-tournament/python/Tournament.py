# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Tournament.py                                      :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2024/12/10 10:24:26 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import asyncio
import logging
#
import AsyncWeb3

logger = logging.getLogger(__name__)

#contract-functions
def _s_to_byte32(value : str) -> bytearray:
	"""`str` to `bytearray(32)`"""
	ret = bytearray(32)
	bvalue = bytearray(str(value), "utf-8")
	n = len(bvalue)
	i = 0
	while (i < 32 and i < n):
		ret[i] = bvalue[i]
		i += 1
	return ret

async def store_tournament_async(
		cupName : str, 
		value : str, 
		contract : any, 
		web3_ : any
	) -> int:
	"""Stores tournament `cupName` results `value`"""
	try:
		_balance0 = await web3_.eth.get_balance(web3_.eth.default_account)
		logger.info(f"balance before: `{_balance0}`")
		_transaction = contract.functions.setScore(_s_to_byte32(cupName), str(value))
		_tx_hash = await AsyncWeb3.transact(_transaction, _balance0, web3_)
		_tx_receipt = await web3_.eth.wait_for_transaction_receipt(_tx_hash)
		_balance1 = await web3_.eth.get_balance(web3_.eth.default_account)
		logger.info(f"balance after: {_balance1} cost: {_balance0 - _balance1}")
	except Exception as e:
		logger.error(f"set: `{cupName}`: ", e)
		return 1
	return 0

async def get_owner(contract : any) -> str:
	"""Gets contract `owner`"""
	_owner = ""
	try:
		_owner = await contract.functions.owner().call()
	except Exception as e:
		logger.error(f"owner: ", e)
	return _owner

async def get_score(cupName : str, contract : any) -> str:
	"""Gets tournament `cupName` results"""
	_results = ""
	try:
		_results = await contract.functions.score(_s_to_byte32(cupName)).call()
	except Exception as e:
		logger.error(f"get: `{cupName}`: ", e)
	return _results

async def _do_stuff_async(
		contract : any,
		web3_ : any
	):
	print(f"owner: {await get_owner(contract)}")
	logger.info("Set score[Cup]='potato'")
	await store_tournament_async("Cup", "potato", contract, web3_)
	print(f"score['Cup']: {await get_score("Cup", contract)}")
	logger.info("Set score[Cup]='potatox'")
	await store_tournament_async("Cup", "potatox", contract, web3_)
	print(f"score['Cup1']: {await get_score("Cup1", contract)}")

async def main():
	"""Tests Tournament"""
	import Deploy
	logging.basicConfig(level=logging.INFO)
	#
	logger.info("Logging in as owner")
	env_ver = AsyncWeb3.ENV_ACCOUNT_SERVICE_KEY
	web3_ = await AsyncWeb3.initialize_web3(AsyncWeb3.get_private_key_from_env(env_ver))
	tournament = await Deploy.get_contract(web3_)
	await _do_stuff_async(tournament, web3_)
	#
	logger.info("Logging in as user")
	env_ver = AsyncWeb3.ENV_ACCOUNT_USER_KEY
	web3_ = await AsyncWeb3.initialize_web3(AsyncWeb3.get_private_key_from_env(env_ver))
	tournament = await Deploy.get_contract(web3_)
	await _do_stuff_async(tournament, web3_)

if __name__ == '__main__':
	asyncio.run(main())
