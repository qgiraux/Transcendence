# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    daemon.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2024/12/10 09:55:12 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import asyncio
import logging
import sys
#
sys.path.insert(0, "./python")
import AsyncWeb3
import Deploy
import Tournament

logger = logging.getLogger(__name__)

async def _do_stuff_async(
		contract : any,
		web3_ : any
	):
	print(await Tournament.get_owner(contract))
	logger.info("set/get Cup potato")
	await Tournament.store_tournament_async("Cup", "potato", contract, web3_)
	print(await Tournament.get_score("Cup", contract))
	logger.info("invalid set/get")
	await Tournament.store_tournament_async("Cup", "potatox", contract, web3_)
	print(await Tournament.get_score("Cup1", contract))

async def main():
	"""Uploads contract"""
	logging.basicConfig(level=logging.INFO)
	web3_ = await AsyncWeb3.initialize_web3()
	tournament = await Deploy.get_contract(web3_)
	await _do_stuff_async(tournament, web3_)
	while (1):
		pass

if __name__ == '__main__':
	asyncio.run(main())
