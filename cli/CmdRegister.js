const {Parser} = require("./Parser")
const {HttpsClient} = require("./HttpsClient")
const {Command} = require("./Command")
//const {Controller} = require("./Controller")
//const assert = require('node:assert')
const {TextEditor} = require("./TextEditor")
const {Localization} = require("./Localization")

let l = new Localization(); //


const TLK_CMD_DESC = "cli.signup.cmd.desc";
const TLK_CMD_SHELL = "cli.signup.cmd.shell";
//const TLK_CMD_OPTS_A = "cli.signup.cmd.opts[]";
//const TLK_SYS_HOST = "sys.host";
const TLK_SYS_ERR = "sys.err";
const TLK_OK = "cli.signup.ok";
const TLK_ERR_PWD_MATCH = "cli.signup.err.pwd:match";
const TLK_ERR_BAD_Q_HOST = "cli.signup.err.bad?host";
const TLK_PROMPT_PWD_RE = "cli.prompt.pwd:re";
const TLK_PROMPT_PWD = "cli.prompt.pwd";
const TLK_PROMPT_LOGIN = "cli.prompt.login";
//const TLK_API_SIGNUP = "api.signup";

class CmdRegister extends Command {
	constructor() {
		
		super(l.t(TLK_CMD_DESC), l.t(TLK_CMD_SHELL));

		const opts = l.source.cli.signup.cmd["opts[]"];
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
		this.hostDefault = l.source.sys.host;
		this.login = "";
		this.password = "";
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
		process.stderr.write(`\x1b[31m${l.t(TLK_SYS_ERR)}: ${text}\x1b[0m\n`);
	}

	static _printResult(ret){
		const statusCode = Number(ret.statusCode);

		if (200 <= statusCode && 300 > statusCode)
			CmdRegister._printSuccess(l.t(TLK_OK));
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
			CmdRegister._printError(l.t(TLK_ERR_PWD_MATCH));
			return ;
		}		
		if (!this.host)
			this.host = this.hostDefault;
		const hostInfo = this.host.split(":");
		if (2 != hostInfo.length)
		{
			CmdRegister._printError(l.t(TLK_ERR_BAD_Q_HOST), {host: this.host});
			return ;
		}	
		const hostname = hostInfo[0];
		const port = Number(hostInfo[1]);

		//HttpsClient.allowSelfSigned(); //
		HttpsClient.post(
			{hostname: hostname, port:port, path: l.source.api.signup},
			JSON.stringify({username: this.login, password: this.password}),
			CmdRegister._printResult
		);
	}

	#stepConfirmPassword(){
		const update = (line) => {this.passwordConfirm = line};
		const nextStep = () => {this.#stepPost();};

		this.#getValue(l.t(TLK_PROMPT_PWD_RE), update, nextStep, true);
	}

	#stepEnterPassword(){
		const update = (line) => {this.password = line};
		const nextStep = () => {this.#stepConfirmPassword();};

		if (!this.password)
			this.#getValue(l.t(TLK_PROMPT_PWD), update, nextStep, true);
		else
			nextStep();
	}

	#stepEnterLogin(){
		const update = (line) => {this.login = line};
		const nextStep = () => {this.#stepEnterPassword();};

		if (!this.login)
			this.#getValue(l.t(TLK_PROMPT_LOGIN), update, nextStep, false);
		else
			nextStep();
	}
}

module.exports = {
	"CmdRegister": CmdRegister
}

// const r = new CmdRegister();
// r.parser.eval();
