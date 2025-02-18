const {HttpsClient} = require("./HttpsClient");

/**
 * Interface to pong HTTPS API
 * @info Refer to `HttpsClient` for how to use `callback`
 */
class ApiPong {
	static #updateOptions(options, path, method) {
		if (!options) {
			options = {};
		}
		options.path = path;
		options.method = method;
		return options;
	}

	/**
	 * Registers to pong using API
	 * @param {https.RequestOptions} options 
	 * @param {String} username 
	 * @param {String} password 
	 * @param {Function} callback
	 */
	static register(options, username, password, callback) {
		HttpsClient.request(
			ApiPong.#updateOptions(
				options, "/api/users/register/", "POST"
			), 
			JSON.stringify({username: username, password: password}), 
			callback
		);
	}

	/**
	 * Logins to pong using API
	 * @param {https.RequestOptions} options 
	 * @param {String} username 
	 * @param {String} password 
	 * @param {Function} callback 
	 */
	static login(options, username, password, callback) {
		HttpsClient.request(
			ApiPong.#updateOptions(
				options, "/api/users/login/", "POST"
			),
			JSON.stringify({username: username, password: password}), 
			callback
		);
	}

	/**
	 * Block user using API
	 * @param {https.RequestOptions} options 
	 * @param {Number} userId 
	 * @param {Function} callback 
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @param {Function} updateJwtAccess 
	 */
	static block(options, userId, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, "/api/friends/blocks/addblock/", "POST"
			), 
			JSON.stringify({id: userId}), 
			callback, jwt, updateJwtAccess
		);
	}

	/**
	 * Unblocks user using API
	 * @param {https.RequestOptions} options 
	 * @param {Number} userId 
	 * @param {Function} callback 
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @param {Function} updateJwtAccess 
	 */
	static unblock(options, userId, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, "/api/friends/blocks/removeblock/", "DELETE"
			),  
			JSON.stringify({id: userId}), 
			callback, jwt, updateJwtAccess
		);
	}

	/**
	 * Gets User Info using API
	 * Or self info if no userId provided
	 * @param {https.RequestOptions} options 
	 * @param {Number | None} userId 
	 * @param {Function} callback 
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @param {Function} updateJwtAccess 
	 */
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

	/**
	 * Gets User Stats via API
	 * @param {https.RequestOptions} options 
	 * @param {Number | None} userId 
	 * @param {Function} callback 
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @param {Function} updateJwtAccess 
	 */
	static getUserStats(options, userId, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, `/api/users/userstats/${userId}`, "GET"
			),  
			JSON.stringify({id: userId}), 
			callback, jwt, updateJwtAccess
		);
	}

	/**
	 * Gets self blocklist via API
	 * @param {https.RequestOptions} options 
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @param {Function} updateJwtAccess 
	 */
	static getBlockList(options, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, "/api/friends/blocks/blockslist/", "GET"
			),  
			null, 
			callback, jwt, updateJwtAccess
		);
	}

	/**
	 * Gets tournament Details via API
	 * @param {https.RequestOptions} options 
	 * @param {String} tournamentName
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @param {Function} updateJwtAccess 
	 */
	static getTournamentDetails(options, tournamentName, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, `/api/tournament/details/${tournamentName}`, "GET"
			),  
			null, 
			callback, jwt, updateJwtAccess
		);
	}

	/**
	 * Joins tournament Details via API
	 * @param {https.RequestOptions} options 
	 * @param {String} tournamentName
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @param {Function} updateJwtAccess 
	 */
	static joinTournament(options, tournamentName, callback, jwt, updateJwtAccess) {
		HttpsClient.reqWithJwt(
			ApiPong.#updateOptions(
				options, "/api/tournament/join/", "POST"
			),  
			JSON.stringify({name: tournamentName}), 
			callback, jwt, updateJwtAccess
		);
	}

	/**
	 * Creates tournament Details via API
	 * @param {https.RequestOptions} options 
	 * @param {String} tournamentName
	 * @param {Number} tournamentSize
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @param {Function} updateJwtAccess 
	 */
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

