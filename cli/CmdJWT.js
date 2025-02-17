const {Parser} = require("./Parser");
const {Command} = require("./Command");
const {TextEditor} = require("./TextEditor");
const {ApiPong} = require("./ApiPong");

class CmdJWT extends Command {
	constructor(onLoggedin = (jwt)=>{console.log(JSON.stringify(jwt))},
		beforeLogin = () => {return 0},
		usage = ""
	) {
		super("Register to Pong", usage);
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
		this.parser.setOptions(opts, callbacks);
		this.parser.defaultCallback = () => {this.#stepLogin()};
		this.host = "";
		this.hostDefault = "localhost:5000";
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

	static #printError(text)
	{
		process.stderr.write(`\x1b[31m${"Error"}: ${text}\x1b[0m\n`);
	}

	// retryRefreshJwt(getOptions, retryCallback, onFailure) {
	// 	HttpsClient.refreshJwt(
	// 		getOptions, 
	// 		this.jwt, 
	// 		(jwt) => {this.jwt = jwt; retryCallback()}, 
	// 		onFailure
	// 	)
	// }

	#stepJWT(ret){
		const statusCode = Number(ret.statusCode);

		if (200 <= statusCode && 300 > statusCode)
		{
			this.jwt = ret.message;
			this.onLoggedin(this.jwt); //
		} else {
			CmdJWT.#printError(`${statusCode}: ${JSON.stringify(ret.message)}`);
		}
	}

	#stepAPILogin(){	
		if (!this.host)
			this.host = this.hostDefault;
		const hostInfo = this.host.split(":");

		if (this.editor) {
			this.editor.stop();
			this.editor = undefined;
		} else if (2 != hostInfo.length) {
			CmdJWT.#printError(`Invalid host ${this.host}.`);
			this.password = "";
			return ;
		}	
		const hostname = hostInfo[0];
		const port = Number(hostInfo[1]);

		ApiPong.login(
			{hostname: hostname, port:port}, 
			this.login, this.password, (ret) => {this.#stepJWT(ret)}
		);
	}

	#stepEnterPassword(){
		const update = (line) => {this.password = line};
		const nextStep = () => {this.#stepAPILogin();};

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
	"CmdJWT": CmdJWT
}

// const r = new CmdJWT();
// r.parser.eval();
