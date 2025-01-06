const https = require('node:https');

class HttpsClient{
	static allowSelfSigned(){
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
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
			let error;

			if (statusCode !== 200) {
				error = new Error('Request Failed.\n');
			} else if (!/^application\/json/.test(contentType)) {
				error = new Error(
					'Invalid content-type.\n'
					+ `Expected application/json but received ${contentType}`);
			}
			if (error) {
				callback({"statusCode": statusCode, "message": error.message});
				res.resume();
				return;
			}
		
			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				try {
					const parsedData = JSON.parse(rawData);

					callback({"statusCode": statusCode, "message": parsedData});
				} catch (e) {
					callback({"statusCode": 500, "message": e.message});
				}
			});
		}).on('error', (e) => {
			callback({"statusCode": 500, "message": e.message});
		});
	}

	/**
	 * 
	 * @param {https.RequestOptions} options 
	 * @param {*} jsonData 
	 * @param {Function} callback 
	 * @param {Number} successCode 
	 * @returns 
	 */
	static post(options={hostname:"localhost", port:443, path:"/"}, jsonData, callback) {
		const postData = JSON.stringify(jsonData);

		options.method = "POST";
		options.headers = {
			'Accept': "application/json",
			'Content-Type': 'application/json',
			'Content-Length': postData.length
		}
		const req = https.request(options, (res) => {
			const { statusCode } = res;

			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				try {
					const parsedData = JSON.parse(rawData);

					callback({"statusCode": statusCode, "message": parsedData});
				} catch (e) {
					callback({"statusCode": 500, "message": e.message});
				}
			});
		}).on('error', (e) => {
			callback({"statusCode": 500, "message": e.message});
		});
		req.end(postData);
	}
}

module.exports = {
	"HttpsClient": HttpsClient
}

// //HttpsClient.get('https://swapi.py4e.com/api/people/1/', console.log);

// HttpsClient.allowSelfSigned();
// //HttpsClient.post({hostname:"localhost", port:5000, path:"/"}, {}, console.log, 200);
// HttpsClient.post({hostname:"localhost", port:5000, path:"/api/users/register/"}, {username:"patate56", password:"Password123#"}, console.log, 200);
// //HttpsClient.post({hostname:"echo.free.beeceptor.com", port:443, path:"/sample-request"}, {username:"patate", password:"pass"}, console.log);
