// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0; //

contract TournamentScores {

	struct Tournament {
		bytes32 name;
		string result;
	}

	Tournament[] public tournaments;

	address public organizer;

	constructor() {
		organizer = msg.sender;
	}

	function getTournamentId(bytes32 tournamentName) public view
		returns (uint _id)
	{
		
		for (_id = 0; _id < tournaments.length; ++_id) {
			if (tournaments[_id].name ==  tournamentName)
				return _id;
		}
	}

	function storeTournament(bytes32 tournamentName, string memory result) external
		returns (uint _id)
	{
		require(msg.sender == organizer);
		_id = getTournamentId(tournamentName);
		require(tournaments.length == _id);
		tournaments.push(Tournament({name:tournamentName, result:result}));
	}

	function getTournament(bytes32 tournamentName) external view
		returns (string memory _result)
	{
		uint _id = getTournamentId(tournamentName);
		require(tournaments.length != _id);
		_result = tournaments[_id].result;
	}
}
