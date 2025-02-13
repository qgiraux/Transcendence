const fs = require('node:fs');

class Logger {
	static #fdOut = 1;

	static log(...args) {
		console.log(args);
	}
}

module.exports = {
	"Logger": Logger
}

