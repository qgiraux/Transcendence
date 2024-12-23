const process = require('node:process');
const assert = require('node:assert');

class Parser {
	/**@type {String[]} */
	commandNames;
	/**@type {Functions[]} */
	commandCallbacks;
	/**@type {String[]} */
	words;
	/**@type {Functions[]} */
	callbacks;
	/**@type {String[]} */
	patterns;
	/**@type {RegExp[]} */
	regex_patterns;
	/**@type {} */
	defaults;
	/**@type {String} */
	help;
	/**@type {Bool} */
	displayHelp;
	/**@type {Functions} */
	defaultAction;

	/**
	 * 
	 * @param {String} help 
	 */
	constructor(help="usage: node pong-cli "){
		this.help = help;
		this.words = Parser.getWords();
		this.patterns = [];
		this.regex_patterns = []; //
		this.callbacks = [];
		this.commandNames = [];
		this.commandCallbacks = [];
		this.displayHelp = false;
		this.defaultCallback = () => {this.displayHelp = true;};
	}

	printHelp(){
		process.stdout.write(this.help);
		for (const pattern_ of this.patterns)
			process.stdout.write(`${pattern_} `);
		if (0 != this.commandNames.length)
		{
			process.stdout.write("<command> [<args>]\n");
			process.stdout.write("commands:\n");
			for (const command_ of this.commandNames)
				process.stdout.write(`${command_}\n`);
		}
		else
			process.stdout.write("\n");
		this.displayHelp = false;
	}

	static getOptionValue(match){
		return match[1];
	}

	_toRegexPatterns(pattern_){
		let match = null;

		match = /^\[([^=<>]+)\]$/.exec(pattern_);
		if (null != match)
		{
			this.regex_patterns.push(new RegExp(`^${match[1]}$`));
			return ;
		}
		match = /^\[(.+)=<(.+)>\]$/.exec(pattern_);
		if (null != match)
		{
			this.regex_patterns.push(new RegExp(`^${match[1]}=(.*)$`));
			return ;
		}
		this.regex_patterns.push(/$^/);
	}

	_setRegexPatterns(){
		this.regex_patterns = [];
		for (const pattern_ of this.patterns)
			this._toRegexPatterns(pattern_)
	}

	setOptions(patterns, callbacks){
		assert.equal(patterns.length, callbacks.length);
		this.patterns = patterns;
		this.callbacks = callbacks;
		this._setRegexPatterns();
	}

	_evalOption(word)
	{
		for (let i = 0; i != this.regex_patterns.length; ++i)
		{
			const match = this.regex_patterns[i].exec(word);

			if (null != match)
			{
				this.callbacks[i](match);
				return i;
			}
		}
		return -1;
	}

	_evalCommand(word)
	{
		const i = this.commandNames.indexOf(word);

		return i;
	}

	eval(){
		this.displayHelp = false;
		let didSomething = 0 == this.commandNames.length;
		let isError = false;
	
		for (const word_ of this.words)
		{
			if ("-" == word_[1])
			{
				if (-1 == this._evalOption(word_))
				{
					process.stdout.write(`unknown option: ${word_}\n`);
					isError = true;
					break;
				}
			}
			else
			{
				didSomething = true;
				if (-1 == this._evalCommand(word_))
				{
					process.stdout.write(`not a valid command: ${word_}\n`);
					isError = true;
					break;
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

// p = new Parser();
// patterns = ["[--help]", "[--version]"]
// callbacks = [()=>{p.displayHelp = true}, ()=>{process.stdout.write("pong-cli version 0.1.0\n")}]
// commandNames = ["register"]
// p.setOptions(patterns, callbacks);
// p.commandNames = commandNames;
// p.eval();
