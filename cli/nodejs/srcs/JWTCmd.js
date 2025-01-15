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
const TL_API_LOGIN = "/api/users/login/";

class JWTCmd extends Command {
	constructor(onLoggedin = (jwt)=>{console.log(JSON.stringify(jwt))},
		beforeLogin = () => {return 0},
		usage = ""
	) {
		super(l.t(TLK_CMD_DESC), usage);
		const opts = l.source.cli.signup.cmd["opts[]"];
		const callbacks = [
			()=>{this.parser.displayHelp = true;}, 
			(match)=>{this.host = Parser.getOptionValue(match);}, 
			(match)=>{this.login = Parser.getOptionValue(match);}, 
			(match)=>{this.password = Parser.getOptionValue(match);}
		];
		this.parser.setOptions(opts, callbacks);
		this.parser.defaultCallback = () => {this.#stepLogin()};
		this.host = "";
		this.hostDefault = l.source.sys.host;
		this.login = "";
		this.password = "";
		this.jwt = {refresh: "", access: ""};
		this.onLoggedin = onLoggedin;
		this.beforeLogin = beforeLogin;
		this.editor = undefined;
	}

	#getValue(prompt = "", callbackUpdate, callbackNext, hidden) {
		process.stdout.write(prompt);
		if (!this.editor) {
			this.editor = new TextEditor();
			this.editor.setOnKeys();
		};
		this.editor.echo = (true == hidden) ? TextEditor.echo_hidden : TextEditor.echo;
		this.editor.refresh = () => {
			process.stdout.write(`\r\x1b[2K${prompt}${this.editor.text}`)
		};
		this.editor.onEnter = () => {
			callbackUpdate(this.editor.text);
			this.editor.text = "";
			process.stdout.write("\n");
			callbackNext();
		};
	}

	static #printError(text)
	{
		process.stderr.write(`\x1b[31m${l.t(TLK_SYS_ERR)}: ${text}\x1b[0m\n`);
	}

	#stepJWT(ret){
		const statusCode = Number(ret.statusCode);

		if (200 <= statusCode && 300 > statusCode)
		{
			this.jwt = ret.message;
			this.onLoggedin(this.jwt); //
		}
		else
			JWTCmd.#printError(`${statusCode}: ${JSON.stringify(ret.message)}`);
	}

	#stepAPILogin(){	
		if (!this.host)
			this.host = this.hostDefault;
		const hostInfo = this.host.split(":");

		if (this.editor) {
			this.editor.stop();
			this.editor = undefined;
		} else if (2 != hostInfo.length) {
			JWTCmd.#printError(l.t(TLK_ERR_BAD_Q_HOST), {host: this.host});
			this.password = "";
			return ;
		}	
		const hostname = hostInfo[0];
		const port = Number(hostInfo[1]);

		
		HttpsClient.allowSelfSigned(); //
		HttpsClient.post(
			{hostname: hostname, port:port, path: TL_API_LOGIN}, //
			JSON.stringify({username: this.login, password: this.password}),
			(ret) => {this.#stepJWT(ret);}
		);
	}

	#stepEnterPassword(){
		const update = (line) => {this.password = line};
		const nextStep = () => {this.#stepAPILogin();};

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

	#stepLogin(){
		if (0 != this.beforeLogin())
			return ;
		if (!this.jwt || !this.jwt.refresh || !this.jwt.access)
			this.#stepEnterLogin();
		else
			this.#stepJWT();
	}
}

module.exports = {
	"JWTCmd": JWTCmd
}

// const r = new JWTCmd();
// r.parser.eval();
