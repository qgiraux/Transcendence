const https = require('node:https');

class HttpsClient{
	static allowSelfSigned(){
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
	}

	static isStatusOk(statusCode) {
		return 300 > statusCode && 200 <= statusCode
	}

	static setUrlInOptions(url, options) {
		const data = url.split(":");

		if (data[0])
			options.host = data[0];
		if (data[1])
			options.port = Number(data[1]);
		return options;
	}

	static get(url, callback, jwt){
		const options = {};

		options.headers = {
			'Accept': "application/json",
		};
		if (jwt && jwt.access)
			options.headers.Authorization = `Bearer ${jwt.access}`;
		return https.get(url, options, (res) => {
			const { statusCode } = res;
			const contentType = res.headers['content-type'];

			if (!/^application\/json/.test(contentType)) {
				callback({"statusCode": 500, "message": 
					'Invalid content-type.\n'
					+ `Expected application/json but received ${contentType}`
				});
				res.resume();
				return ;
			}
			res.setEncoding('utf8');
			let rawData = '';

			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				try {
					const parsedData = JSON.parse(rawData);

					callback({"statusCode": statusCode, "message": parsedData});
				} catch (e) {
					callback({"statusCode": statusCode, "message": rawData});
				}
			});
		}).on('error', (e) => {
			callback({"statusCode": 500, "message": e.message});
		});
	}


	/**
	 * 
	 * @param {https.RequestOptions} options 
	 * @param {String} jsonData 
	 * @param {Function} callback 
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @returns 
	 */
	static post(options={hostname:"localhost", port:443, path:"/"}, jsonData, callback, jwt) {
		options.method = "POST";
		options.headers = {
			'Accept': "application/json",
			'Content-Type': 'application/json',
			'Content-Length': jsonData.length
		}
		if (jwt && jwt.access)
			options.headers.Authorization = `Bearer ${jwt.access}`;
		const req = https.request(options, (res) => {
			const { statusCode } = res;
			const contentType = res.headers['content-type'];

			if (!/^application\/json/.test(contentType)) {
				callback({"statusCode": 500, "message": 
					'Invalid content-type.\n'
					+ `Expected application/json but received ${contentType}`
				});
				res.resume();
				return ;
			}
			res.setEncoding('utf8');
			let rawData = '';

			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				try {
					const parsedData = JSON.parse(rawData);

					callback({"statusCode": statusCode, "message": parsedData});
				} catch (e) {
					callback({"statusCode": statusCode, "message": rawData});
				}
			});
		}).on('error', (e) => {
			callback({"statusCode": 500, "message": e.message});
		});
		req.end(jsonData);
	}


	/**
	 * 
	 * @param {https.RequestOptions} options 
	 * @param {String} jsonData 
	 * @param {Function} callback 
	 * @param {Object} jwt
	 * @param {String} jwt.access
	 * @param {String} jwt.refresh
	 * @returns 
	 */
	static request(options={hostname:"localhost", port:443, path:"/"}, jsonData, callback) {
		if (!options.headers)
			options.headers = {}
		options.headers.Accept = "application/json"
		if (jsonData) {
			options.headers['Content-Type'] = 'application/json',
			options.headers['Content-Length']= jsonData.length
		}
		// console.error(options); //
		// console.error(jsonData); //
		const req = https.request(options, (res) => {
			const { statusCode } = res;
			const contentType = res.headers['content-type'];

			if (!/^application\/json/.test(contentType)) {
				callback({"statusCode": 500, "message": 
					'Invalid content-type.\n'
					+ `Expected application/json but received ${contentType}`
				});
				res.resume();
				return ;
			}
			res.setEncoding('utf8');
			let rawData = '';

			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				try {
					const parsedData = JSON.parse(rawData);

					callback({"statusCode": statusCode, "message": parsedData});
				} catch (e) {
					callback({"statusCode": statusCode, "message": rawData});
				}
			});
		}).on('error', (e) => {
			callback({"statusCode": 500, "message": e.message});
		});
		req.end(jsonData);
	}

	static reqWithJwt(options, jsonData, callback, jwt, onRefresh) {
		//jwt.access = "Patate"; //
		if (!options.headers)
			options.headers = {}
		options.headers.Authorization = `Bearer ${jwt.access}`;
		const onRet = (ret) => {
			if (
				401 == ret.statusCode 
				&& ret.message 
				&& "token_not_valid" == ret.message.code
			) {
				const _onRefresh = (ret) => {
					if (HttpsClient.isStatusOk(ret.statusCode)) {
						const access = ret.message.access;

						onRefresh(access);
						options.headers = {Authorization: `Bearer ${access}`};
						HttpsClient.request(options, jsonData, callback);
					} else {
						callback(ret);
					}
				};
				let postOptions = Object.assign({}, options);

				postOptions.method = "POST";
				postOptions.path = "/api/users/refresh/";
				HttpsClient.request(postOptions, JSON.stringify({refresh: jwt.refresh}), _onRefresh);
			} else {
				callback(ret);
			}
		}

		HttpsClient.request(Object.assign({}, options), jsonData, onRet);
	}

	// static refreshJwt(options, jwt, callback) {
	// 	const refreshCallback = (ret) => {
	// 		if (
	// 			401 == ret.statusCode 
	// 			&& ret.message 
	// 			&& "token_not_valid" == ret.message.code
	// 		) {
	// 			HttpsClient.post(options, JSON.stringify({refresh: jwt.refresh}), callback);
	// 		} else {
	// 			callback(ret);
	// 		}
	// 	}

	// 	callback()
	// }
}

module.exports = {
	"HttpsClient": HttpsClient
}

// //HttpsClient.get('https://swapi.py4e.com/api/people/1/', console.log);

// HttpsClient.allowSelfSigned();
// //HttpsClient.post({hostname:"localhost", port:5000, path:"/"}, {}, console.log, 200);
// HttpsClient.post({hostname:"localhost", port:5000, path:"/api/users/register/"}, {username:"patate56", password:"Password123#"}, console.log, 200);
// //HttpsClient.post({hostname:"echo.free.beeceptor.com", port:443, path:"/sample-request"}, {username:"patate", password:"pass"}, console.log);
