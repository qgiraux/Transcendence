# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Compile.py                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jerperez <jerperez@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/22 13:12:29 by jerperez          #+#    #+#              #
#    Updated: 2025/01/20 11:04:20 by jerperez         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#
import json
import Utils

SOLC_OUTPUT_JSON = "/solc_output.json"

# def get_solc_output_from_read(read_fun) -> tuple[str, str]:
# 	"""Gets compiled contract `bytecode` and `metadata`"""
# 	data = json.loads(read_fun())
# 	contract_data=data['contracts']['TournamentScores']['TournamentScores']
# 	bytecode = contract_data['evm']['bytecode']['object']
# 	metadata = contract_data['metadata']
# 	return bytecode, metadata

# def get_solc_output_from_json(jsonFile=SOLC_OUTPUT_JSON) -> tuple[str, str]:
# 	"""Gets compiled contract `bytecode` and `metadata`"""
# 	def read_fun():
# 		return Utils.readfile(jsonFile)
# 	return get_solc_output_from_read(read_fun)

def get_solc_output_from_json(jsonFile=SOLC_OUTPUT_JSON) -> tuple[str, str]:
	"""Gets compiled contract `bytecode` and `metadata`"""
	data = json.loads(Utils.readfile(jsonFile))
	contract_data=data['contracts']['TournamentScores']['TournamentScores']
	bytecode = contract_data['evm']['bytecode']['object']
	metadata = contract_data['metadata']
	return bytecode, metadata

def main():
	"""Uploads contract"""
	import logging
	logger = logging.getLogger(__name__)
	logging.basicConfig(level=logging.INFO)
	bytecode, metadata = get_solc_output_from_json(SOLC_OUTPUT_JSON)
	print(f'bytecode=\n{bytecode}')
	print(f'metadata=\n{metadata}')

if __name__ == '__main__':
	main()
