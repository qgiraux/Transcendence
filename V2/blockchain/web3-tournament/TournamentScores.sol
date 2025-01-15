// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

/**
 * @title Tournament scores storage contract
 * @author jerperez
 * @dev Intended for use with a remote Hardhat network
 */
contract TournamentScores {
    mapping(bytes32 => string) public score;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /**Sets `score[tournament]` to `result`
     * @param tournament Tournament name, tournament[0] cannot be 0
     * @param result Tournament result, cannot be ""
     * @dev No custom errors because remote Hardhat does not support them.
     */
    function setScore(bytes32 tournament, string memory result) external
    {
        require(msg.sender == owner, "Unauthorized sender");
        require(0 != tournament.length, "Invalid tournament name");
        require(0 != bytes(result).length, "Invalid tournament result");
        require(0 == bytes(score[tournament]).length, "Tournament already exists");
        score[tournament] = result;
    }
}
