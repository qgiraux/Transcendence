const process = require('node:process');
const assert = require('node:assert');

class Parser {
	/**
	 * 
	 * @param {String} help 
	 */
	constructor(help="usage: node pong-cli "){
		/**@type {String} */
		this.help = help;
		/**@type {String[]} */
		this.words = Parser.getWords();
		/**@type {String[]} */
		this.patterns = [];
		/**@type {RegExp[]} */
		this.regex_patterns = []; //
		/**@type {Functions[]} */
		this.callbacks = [];
		/**@type {Object[]} */
		this.commands = [];
		/**@type {String[]} */
		this.commandNames = [];
		/**@type {Bool} */
		this.displayHelp = false;
		this.defaultCallback = () => {this.displayHelp = true;};
	}

	printHelp(){
		process.stdout.write(this.help);
		for (const pattern_ of this.patterns)
			process.stdout.write(`${pattern_} `);
		if (0 != this.commands.length) {
			process.stdout.write("<command> [<args>]\n");
			process.stdout.write("commands:\n");
			for (const command_ of this.commands)
				process.stdout.write(`    ${command_.name}\t${command_.description}\n`);
		} else {
			process.stdout.write("\n");
		}
		this.displayHelp = false;
	}

	static getOptionValue(match){
		return match[1];
	}

	#toRegexPatterns(pattern_){
		let match = null;

		match = /^\[([^=<>]+)\]$/.exec(pattern_);
		if (null != match) {
			this.regex_patterns.push(new RegExp(`^${match[1]}$`));
			return ;
		}
		match = /^\[(.+)=<(.+)>\]$/.exec(pattern_);
		if (null != match) {
			this.regex_patterns.push(new RegExp(`^${match[1]}=(.*)$`));
			return ;
		}
		this.regex_patterns.push(/$^/);
	}

	addOptions(patterns, callbacks){
		assert.equal(patterns.length, callbacks.length);
		this.patterns.push(...patterns);
		this.callbacks = this.callbacks.concat(callbacks);
		for (const pattern_ of patterns)
			this.#toRegexPatterns(pattern_);
	}

	setOptions(patterns, callbacks){
		assert.equal(patterns.length, callbacks.length);
		this.patterns = patterns;
		this.callbacks = callbacks;
		for (const pattern_ of patterns)
			this.#toRegexPatterns(pattern_);
	}

	_evalOption(word) {
		for (let i = 0; i != this.regex_patterns.length; ++i) {
			const match = this.regex_patterns[i].exec(word);

			if (null != match) {
				this.callbacks[i](match);
				return i;
			}
		}
		return -1;
	}

	_evalCommand(word) {
		const i = this.commandNames.indexOf(word);
 
		return i;
	}

	eval(){
		this.displayHelp = false;
		let didSomething = 0 == this.commands.length;
		let isError = false;

		this.commandNames = this.commands.map(value_ => value_.name);
		for (let i = 0; this.words.length != i; ++i) {
			let word_ = this.words[i];

			if ("-" == word_[1]) {
				if (-1 == this._evalOption(word_)) {
					process.stdout.write(`unknown option: ${word_}\n`);
					isError = true;
					break;
				}
			} else {
				didSomething = true;
				const cmd = this._evalCommand(word_);

				if (-1 == this._evalCommand(word_)) {
					process.stdout.write(`not a valid command: ${word_}\n`);
					isError = true;
					break;
				} else {
					this.commands[cmd].parser.words = this.words.slice(i + 1);
					this.commands[cmd].parser.eval();
					return ;
				}
			}
		}
		if (false == isError && false == this.displayHelp)
			this.defaultCallback();
		else if (true == isError || false == didSomething || true == this.displayHelp)
			this.printHelp();
	}

	/**
	 * 
	 * @param {String[]} argv 
	 * @param {Number} start 
	 * @returns {String[]} words 
	 */
	static getWords(start=2)
	{
		return process.argv.slice(2);
	}
}

module.exports = {
	"Parser": Parser
}
