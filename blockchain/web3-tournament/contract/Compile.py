# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Compile.py                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2025/01/23 14:29:51 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import json
import Utils

JSON_FILE = "/solc_output.json"

def get_solc_output_from_json(jsonFile=JSON_FILE) -> tuple[str, str]:
	"""Gets compiled contract `bytecode` and `metadata`"""
	data = json.loads(Utils.readfile(jsonFile))
	contract_data=data['contracts']['TournamentScores']['TournamentScores']
	bytecode = contract_data['evm']['bytecode']['object']
	metadata = contract_data['metadata']
	return bytecode, metadata


def main():
	"""Uploads contract"""
	logging.basicConfig(level=logging.INFO)
	bytecode, metadata = get_solc_output_from_json(JSON_FILE)
	logger.info("bytecode:")
	logger.info(bytecode)
	logger.info("metadata:")
	logger.info(metadata)


if __name__ == '__main__':
	import logging
	logger = logging.getLogger(__name__)
	main()
