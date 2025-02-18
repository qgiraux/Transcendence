const {Parser} = require("./Parser");

class Command {
	constructor(description="Pong CLI", usage="node pong-cli") {
		/**@type {String} */
		this.name = "<name>";
		/**@type {String} */
		this.description = description;
		/**@type {String} */
		this.usage = usage;
		/**@type {Parser} */
		this.parser = new Parser();
		this.setUsage(usage);
	}

	/**
	 * Sets usage
	 * @param {String} usage 
	 */
	setUsage(usage) {
		this.parser.help = `usage: ${usage} `;
	}
}

module.exports = {
	"Command": Command
}
