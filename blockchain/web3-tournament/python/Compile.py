# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Compile.py                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2024/12/09 16:08:46 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import json
import logging
#
#import solcx
#
import Utils

JSON_FILE = "/tournament.json"

logger = logging.getLogger(__name__)

#
# def get_solc_output_from_source(sourceName):
# 	source = readfile(sourceName)
# 	assert "" != source
# 	solcx.install_solc(version='latest')
# 	compiled_sol = solcx.compile_source(source, output_values=['bin', 'metadata'], optimize=True, optimize_runs=10)
# 	contract_id, contract_interface = compiled_sol.popitem()
# 	bytecode = contract_interface['bin']
# 	metadata = contract_interface['metadata']
# 	return bytecode, metadata

def get_solc_output_from_json(jsonFile : str) -> tuple[str, str]:
	"""Gets compiled contract `bytecode` and `metadata`"""
	data = json.loads(Utils.readfile(jsonFile))
	contract_data=data['contracts']['TournamentScores']['TournamentScores']
	bytecode = contract_data['evm']['bytecode']['object']
	metadata = contract_data['metadata']
	return bytecode, metadata


async def main():
	"""Uploads contract"""
	logging.basicConfig(level=logging.INFO)
	bytecode, metadata = get_solc_output_from_json(JSON_FILE)

if __name__ == '__main__':
	main()
