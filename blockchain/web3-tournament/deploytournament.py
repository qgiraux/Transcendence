# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    deploytournament.py                                :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/01/17 10:50:15 by jerperez          #+#    #+#              #
#    Updated: 2025/02/18 09:57:36 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import asyncio
import sys
#
sys.path.insert(0, "/contract") #ugly
import AsyncWeb3
import Deploy

JSON_FILE = "/tournament.json"

async def main():
	w3 = await AsyncWeb3.initialize_web3()
	contract = await Deploy.get_contract(w3, JSON_FILE)
	await AsyncWeb3.disconnect(w3)

if __name__ == '__main__':
	asyncio.run(main())
