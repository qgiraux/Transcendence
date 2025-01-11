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

class RegisterCmd extends Command {
	constructor() {
		
		super(l.t(TLK_CMD_DESC), l.t(TLK_CMD_SHELL));

		const opts = l.source.cli.signup.cmd["opts[]"];
		const callbacks = [
			()=>{this.parser.displayHelp = true;}, 
			(match)=>{this.host = Parser.getOptionValue(match);}, 
			(match)=>{this.login = Parser.getOptionValue(match);}, 
			(match)=>{this.password = Parser.getOptionValue(match);}
		];
		this.parser.setOptions(opts, callbacks);
		this.parser.defaultCallback = () => {this._stepEnterLogin()};
		this.host = "";
		this.hostDefault = l.source.sys.host;
		this.login = "";
		this.password = "";
		this.passwordConfirm = "";
		this.editor = undefined;
	}

	_getValue(prompt = "", callbackUpdate, callbackNext, hidden){
		process.stdout.write(prompt);
		if (!this.editor) {
			this.editor = new TextEditor();
			this.editor.setOnKeys();
		};
		this.editor.echo = (true == hidden) ? TextEditor.echo_hidden : TextEditor.echo;
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
			RegisterCmd._printSuccess(l.t(TLK_OK));
		else
			RegisterCmd._printError(`${statusCode}: ${JSON.stringify(ret.message)}`);
	}

	_stepPost(){
		if (this.editor) {
			this.editor.stop();
			this.editor = undefined;
		}
		if (this.password != this.passwordConfirm)
		{
			RegisterCmd._printError(l.t(TLK_ERR_PWD_MATCH));
			return ;
		}		
		if (!this.host)
			this.host = this.hostDefault;
		const hostInfo = this.host.split(":");
		if (2 != hostInfo.length)
		{
			RegisterCmd._printError(l.t(TLK_ERR_BAD_Q_HOST), {host: this.host});
			return ;
		}	
		const hostname = hostInfo[0];
		const port = Number(hostInfo[1]);

		
		HttpsClient.allowSelfSigned(); //
		HttpsClient.post(
			{hostname: hostname, port:port, path: l.source.api.signup},
			JSON.stringify({username: this.login, password: this.password}),
			RegisterCmd._printResult
		);
	}

	_stepConfirmPassword(){
		const update = (line) => {this.passwordConfirm = line};
		const nextStep = () => {this._stepPost();};

		this._getValue(l.t(TLK_PROMPT_PWD_RE), update, nextStep, true);
	}

	_stepEnterPassword(){
		const update = (line) => {this.password = line};
		const nextStep = () => {this._stepConfirmPassword();};

		if (!this.password)
			this._getValue(l.t(TLK_PROMPT_PWD), update, nextStep, true);
		else
			nextStep();
	}

	_stepEnterLogin(){
		const update = (line) => {this.login = line};
		const nextStep = () => {this._stepEnterPassword();};

		if (!this.login)
			this._getValue(l.t(TLK_PROMPT_LOGIN), update, nextStep, false);
		else
			nextStep();
	}
}

const r = new RegisterCmd();
r.parser.eval();
