const {Parser} = require("./Parser")

class Command {
	/**@type {String} */
	description;
	/**@type {String} */
	usage;
	//**@type {Parser} */
	parser;

	constructor(description="Pong CLI", usage="node pong-cli") {
		this.description = description;
		this.usage = usage;
		this.parser = new Parser(`usage: ${usage} `);
	}
}

module.exports = {
	"Command": Command
}

// console.log(Parser);
// const c = new Command();
// c.argParser.eval();

