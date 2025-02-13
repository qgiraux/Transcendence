const {HttpsClient} = require("./HttpsClient");

class ApiPong {
	static #updateOptions(options, path, method) {
		if (!options) {
			options = {};
		}
		options.path = path;
		options.method = method;
		return options;
	}

	static register(options, username, password, callback) {
		HttpsClient.request(
			ApiPong.#updateOptions(
				options, "/api/users/register/", "POST"
			), 
			JSON.stringify({username: username, password: password}), 
			callback
		);
	}

	static login(options, username, password, callback) {
		HttpsClient.request(
			ApiPong.#updateOptions(
				options, "/api/users/login/", "POST"
			),
			JSON.stringify({username: username, password: password}), 
			callback
		);
	}

	static block(options, userId, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, "/api/friends/blocks/addblock/", "POST"
			), 
			JSON.stringify({id: userId}), 
			callback, jwt, updateJwtAccess
		);
	}

	static unblock(options, userId, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, "/api/friends/blocks/removeblock/", "DELETE"
			),  
			JSON.stringify({id: userId}), 
			callback, jwt, updateJwtAccess
		);
	}

	static getUserInfo(options, userId, callback, jwt, updateJwtAccess) {
		if (userId) {
			HttpsClient.reqWithJwt(
				ApiPong.#updateOptions(
					options, `/api/users/userinfo/${userId}`, "GET"
				),
				JSON.stringify({id: userId}), 
				callback, jwt, updateJwtAccess
			);
		} else {
			HttpsClient.reqWithJwt(
				ApiPong.#updateOptions(
					options, `/api/users/userinfo/`, "GET"
				),
				null, 
				callback, jwt, updateJwtAccess
			);
		}
	}

	static getUserStats(options, userId, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, `/api/users/userstats/${userId}`, "GET"
			),  
			JSON.stringify({id: userId}), 
			callback, jwt, updateJwtAccess
		);
	}

	static getBlockList(options, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, "/api/friends/blocks/blockslist/", "GET"
			),  
			null, 
			callback, jwt, updateJwtAccess
		);
	}

	static getTournamentDetails(options, tournamentName, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, `/api/tournament/details/${tournamentName}`, "GET"
			),  
			null, 
			callback, jwt, updateJwtAccess
		);
	}

	static joinTournament(options, tournamentName, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, "/api/tournament/join/", "POST"
			),  
			JSON.stringify({name: tournamentName}), 
			callback, jwt, updateJwtAccess
		);
	}

	static createTournament(options, tournamentName, tournamentSize, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, "/api/tournament/create/", "POST"
			),  
			JSON.stringify({name: tournamentName, size: tournamentSize}), 
			callback, jwt, updateJwtAccess
		);
	}
}

module.exports = {
	"ApiPong": ApiPong
}

