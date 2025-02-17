const {Parser} = require("./Parser");
const {Command} = require("./Command");
const {TextEditor} = require("./TextEditor");
const {ApiPong} = require("./ApiPong");

const TLK_PROMPT_LOGIN = "cli.prompt.login";

class CmdRegister extends Command {
	constructor() {
		
		super("Register to Pong", "node pong-cli signup");

		const opts = [
			"[--help]", 
			"[--host=<hostname:port>]", 
			"[--login=<login>]", 
			"[--password=<password>]"
		];
		const callbacks = [
			()=>{this.parser.displayHelp = true;}, 
			(match)=>{this.host = Parser.getOptionValue(match);}, 
			(match)=>{this.login = Parser.getOptionValue(match);}, 
			(match)=>{this.password = Parser.getOptionValue(match);}
		];
		this.name = "signup";
		this.parser.setOptions(opts, callbacks);
		this.parser.defaultCallback = () => {this.#stepEnterLogin()};
		this.host = "";
		this.hostDefault = "localhost:5000";
		/**@type {String} */
		this.login = "";
		/**@type {String} */
		this.password = "";
		/**@type {String} */
		this.passwordConfirm = "";
		this.editor = undefined;
	}

	#getValue(prompt = "", callbackUpdate, callbackNext, hidden){
		process.stdout.write(prompt);
		if (!this.editor) {
			this.editor = new TextEditor();
			this.editor.setOnKeys();
		};
		if (true == hidden) {
			this.editor.echo = TextEditor.echo_hidden;
			this.editor.refresh = () => {
				process.stdout.write(
					`\r\x1b[2K${prompt}${"*".repeat(this.editor.text.length)}`
			)};
		} else {
			this.editor.echo = TextEditor.echo;
			this.editor.refresh = () => {
				process.stdout.write(`\r\x1b[2K${prompt}${this.editor.text}`)
			};
		}
		this.editor.onEnter = () => {
			callbackUpdate(this.editor.text);
			this.editor.text = "";
			process.stdout.write("\n");
			callbackNext();
		};
	}

	static _printSuccess(text)
	{
		process.stdout.write(`\x1b[32m${text}\x1b[0m\n`);
	}

	static _printError(text)
	{
		process.stderr.write(`\x1b[31m${"Error"}: ${text}\x1b[0m\n`);
	}

	static _printResult(ret){
		const statusCode = Number(ret.statusCode);

		if (200 <= statusCode && 300 > statusCode)
			CmdRegister._printSuccess("Registration success!");
		else
			CmdRegister._printError(`${statusCode}: ${JSON.stringify(ret.message)}`);
	}

	#stepPost(){
		if (this.editor) {
			this.editor.stop();
			this.editor = undefined;
		}
		if (this.password != this.passwordConfirm)
		{
			CmdRegister._printError("Passwords do not match.");
			return ;
		}		
		if (!this.host)
			this.host = this.hostDefault;
		const hostInfo = this.host.split(":");
		if (2 != hostInfo.length)
		{
			CmdRegister._printError(`Invalid host ${this.host}.`);
			return ;
		}	
		const hostname = hostInfo[0];
		const port = Number(hostInfo[1]);

		ApiPong.register(
			{hostname: hostname, port:port}, 
			this.login, this.password, CmdRegister._printResult
		);
	}

	#stepConfirmPassword(){
		const update = (line) => {this.passwordConfirm = line};
		const nextStep = () => {this.#stepPost();};

		this.#getValue("Confirm password:", update, nextStep, true);
	}

	#stepEnterPassword(){
		const update = (line) => {this.password = line};
		const nextStep = () => {this.#stepConfirmPassword();};

		if (!this.password)
			this.#getValue("Enter password:", update, nextStep, true);
		else
			nextStep();
	}

	#stepEnterLogin(){
		const update = (line) => {this.login = line};
		const nextStep = () => {this.#stepEnterPassword();};

		if (!this.login)
			this.#getValue("Enter login:", update, nextStep, false);
		else
			nextStep();
	}
}

module.exports = {
	"CmdRegister": CmdRegister
}

// const r = new CmdRegister();
// r.parser.eval();
