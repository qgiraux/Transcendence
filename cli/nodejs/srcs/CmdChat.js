const {JWTCmd} = require("./JWTCmd");
const {Localization} = require("./Localization");
const WebSocket = require('ws'); //npm install ws
const {HttpsClient} = require("./HttpsClient");
const {TextEditor} = require("./TextEditor");
//const {Controller} = require("./Controller");

let l = new Localization(); //

//const TLK_CMD_DESC = "cli.signup.cmd.desc";
// const TLK_CMD_SHELL = "cli.signup.cmd.shell";
// //const TLK_CMD_OPTS_A = "cli.signup.cmd.opts[]";
// //const TLK_SYS_HOST = "sys.host";
// const TLK_SYS_ERR = "sys.err";
// const TLK_OK = "cli.signup.ok";
// const TLK_ERR_PWD_MATCH = "cli.signup.err.pwd:match";
// const TLK_ERR_BAD_Q_HOST = "cli.signup.err.bad?host";
// const TLK_PROMPT_PWD_RE = "cli.prompt.pwd:re";
// const TLK_PROMPT_PWD = "cli.prompt.pwd";
// const TLK_PROMPT_LOGIN = "cli.prompt.login";
// //const TLK_API_SIGNUP = "api.signup";
// const TL_API_LOGIN = "/api/users/login/";

//wws://localhost:5000/ws/chat/?token=<access_token>


class ChatMessage {
	/**
	 * @param {String} dataStr
	 */
	constructor(dataStr) {
		const data = JSON.parse(dataStr);

		/** @type {"chat" | "notification" | "invite" | "GOTO" | String} */
		this.type = data.type;
		/** @type {String} */
		this.message = data.message;
		/** @type {"global_chat" | `user_${Number}` | String} */
		this.group = data.group;
		/** @type {Number} */
		this.sender = data.sender;
	}

	//save:\x1b[s restore:\x1b[u

	/**
	 * @param {"chat" | "notification" | "invite" | "GOTO" | String} type
	 * @param {String} message
	 * @param {"global_chat" | `user_${Number}` | String} group
	 * @param {Number | any} sender
	 */
	static toJsonString(type, message, group, sender=-1) {
		return JSON.stringify({
			type: type,
			message: message,
			group: group,
			sender: sender,
		});
	}

	static isValid(obj) {
		if (!obj.type || !obj.message || !obj.group || !obj.sender)
			return false;
		try {
			ChatMessage.normalize(obj);
		} catch (e) {
			return false;
		}
		return true;
	}

	static normalize(obj) {
		obj.type = String(obj.type);
		obj.message = String(obj.message);
		obj.group = String(obj.group);
		obj.sender = Number(obj.sender);
	}

	toJsonString() {
		return JSON.stringify({
			type: this.type,
			message: this.message,
			group: this.group,
			sender: this.sender,
		});
	}

	//`/api/users/userinfo/${sender}`
}

class CmdChat extends JWTCmd {
	constructor() {
		super((jwt)=>{this.onLogin(jwt);});
		this.name = "chat";
		this.description = "Enter chat, get easy access to the API and WS endpoints.";
		this.setUsage("pong-cli chat"); //
		this.nicknames = {};
		this.me = -1;
		this.editor = undefined;
		this.ws = undefined;
	}

	static #getHelp() {
		return ""
			+ "Controls:\n"
			+ "[↵] Post [⌫] Remove typed character [^C/^D] Exit\n"
			+ "Commands:\n"
			+ "\x1b[1m" + "!help" + "\x1b[0m " + "Prints this message\n"
			+ "\x1b[1m" + "!direct <userId> <message>" + "\x1b[0m " + "Sends a direct message\n"
			+ "\x1b[1m" + "!block <userId>" + "\x1b[0m " + "Blocks user\n"
			+ "\x1b[1m" + "!unblock <userId>" + "\x1b[0m " + "Unblocks user\n"
			+ "\x1b[1m" + "!invite <userId> <game>" + "\x1b[0m " + "Invite user to a game\n"
			+ "\x1b[1m" + "!profile <userId>" + "\x1b[0m " + "View user profile\n"
			+ "\x1b[1m" + "!api get <path>" + "\x1b[0m " + "Send Get Http Request to Pong Endpoints\n"
			+ "\x1b[1m" + "!api post <path> <json>" + "\x1b[0m " + "Send Post Http Request to Pong Endpoints\n"
			+ "\x1b[1m" + "!ws [chat | invite | <type>] [user_<userId> | global_chat | <group>] <message>" + "\x1b[0m " + "Send WS message\n"
			+ "\x1b[1m" + "!!<message>" + "\x1b[0m " + "Sends !<message>\n"
			+ "\x1b[1m" + "!exit" + "\x1b[0m " + "Leave Chat\n"
			+ "_____________________________________________________________________________________________\n"
		;
	}

	//CMDS
	#help() {
		process.stdout.write(CmdChat.#getHelp());
	}

	#block(words) {
		; //#TODO
	}

	#unblock(words) {
		; //#TODO
	}

	#invite(words) {
		if (!words[0] || "invite" !== words[0]
			|| !words[1] || words[1] == this.me 
			|| !words[2]
		){
			CmdChat.writeSystem(`missing or incorrect <userId> or <game>\n`);
			return ;
		}
		this.ws.send(ChatMessage.toJsonString("invite", words[2], `user_${words[1]}`, -1));
	}

	#profile(words) {
		; //#TODO
	}

	#unknown(words) {
		CmdChat.writeSystem(`unknown command '${words[0]}'\n`);
		this.#help();
	}
  
	#api(words) {
		if (!words || "api" != words[0]) {
			return ;
		} else if (!words[1] || !words[2]) {
			CmdChat.writeSystem(`missing api method or path'\n`);
			return ;
		}
		if ("get" == words[1]) {
			HttpsClient.get(`https://${this.host}/${words[2]}`, (ret)=>{CmdChat.writeSystem(`${JSON.stringify(ret)}\n`)}, this.jwt);
		} else if ("post" == words[1]) {
			HttpsClient.post(
				HttpsClient.setUrlInOptions(this.host, {path: words[2]}),
				words.slice(3).join(" "),
				(ret)=>{CmdChat.writeResponse(ret)},
				this.jwt
			);
		} else {
			CmdChat.writeSystem(`unknown command 'api ${words[1]}'\n`);
		}
	}

	#ws(words) {
		if (!words || "ws" != words[0]) {
			return ;
		} else if (!words[1] || !words[2] || words[2] == `user_${this.me}`) {
			CmdChat.writeSystem(`missing or incorrect <type> or <group>\n`);
			return ;
		}
		const message = (!!words[3]) ? words[3] : "";

		this.ws.send(ChatMessage.toJsonString(words[1], message, words[2], -1));
	}

	#direct(words) {
		const user = words[1];

		if (!user)
			return ;
		const message = words.slice(2).join(" ");
		const dest = this.nicknames[user];

		if (!!dest)
			CmdChat.formatChat(this.nicknames[this.me], message, "me", [`to ${dest}[${user}]`]);
		else
			CmdChat.formatChat(this.nicknames[this.me], message, "me", [`to [${user}]`]);
		if (user != this.me)
			this.ws.send(ChatMessage.toJsonString("chat", message, `user_${user}`));
	}

	#exit() {
		this.editor.stop();
		this.ws.close();
		CmdChat.writeSystem(`Left chat\n`);
	}

	static #echoCommand(text) {
		process.stdout.write(`\x1b[3;33m!${text}\x1b[0m\n`); //
	}

	#parseCommand(text) {
		const words = text.split(" ");
		const command = words[0];

		if (!text)
			return ;
		if ("!" == text[0]) {
			this.ws.send(ChatMessage.toJsonString("chat", text, "global_chat"));
			return ;
		}
		CmdChat.#echoCommand(text);
		let cmdId = 1 + ["help", "direct", "block", "unblock", "invite", "profile", "api", "ws", "exit"
			].indexOf(command);
		const cmdFun = [
			(w)=>{this.#unknown(w)},
			(w)=>{this.#help()},
			(w)=>{this.#direct(w)},
			(w)=>{this.#block(w)}, //#TODO
			(w)=>{this.#unblock(w)}, //#TODO
			(w)=>{this.#invite(w)}, //#TODO
			(w)=>{this.#profile(w)}, //#TODO
			(w)=>{this.#api(w)},
			(w)=>{this.#ws(w)},
			(w)=>{this.#exit()},
		];

		cmdFun[cmdId](words);
	}

	/**
	 * @param {String} text 
	 * @returns 
	 */
	#parseInput(text) {
		if (!text) {
			return ; //
		} else if ("!" == text[0]) {
			this.#parseCommand(text.substring(1));
		} else {
			this.ws.send(ChatMessage.toJsonString("chat", text, "global_chat")); //
		}
	}

	static writeSystem(message) {
		process.stdout.write(`info: ${message}`);
	}


	static writeResponse(jsonResponse) {
		if (typeof jsonResponse != "object") {
			process.stdout.write(String(jsonResponse));
			return ;
		}
		let pretty = new String("Status code: ");

		if (300 > jsonResponse.statusCode && 200 <= jsonResponse.statusCode)
			pretty += `\x1b[32m`;
		else
			pretty += `\x1b[31m`;
		pretty += `${jsonResponse.statusCode}\x1b[0m\n`
		pretty += (typeof jsonResponse.message === "string") ?
			jsonResponse.message : JSON.stringify(jsonResponse.message, null, " ");
		if ("\n" != pretty.slice(-1))
			pretty += "\n";
		process.stdout.write(pretty);
	}

	static formatChat(nickname, message, nickQualifier, messageQualifier) {
		message = message
			.replace(/\s*/, "")
			.replace(/\s+/gm, " ")
			.replace(/\p{Cc}/ugm, ""); //"�"
		if ("\n" != message.slice(-1))
			message += "\n";
		let out = "";

		out += `\x1b[1;36m${nickname}\x1b[0m`;
		if (nickQualifier)
			out += `[${nickQualifier}]`;
		out += `: `;
		if (0 !== messageQualifier.length)
			out += `(\x1b[3m${messageQualifier.join(" ")}\x1b[0m): `;
		out += message;
		process.stdout.write(out);
	}

	writeChat(data, userInput="") {
		let messageQualifier = ("chat" === data.type) ? [] : [data.type];

		if ("global_chat" != data.group)
			messageQualifier.push("direct");
		const userId = data.sender;

		if (this.me != -1 && this.me == userId) {
			CmdChat.formatChat(this.nicknames[this.me], data.message, "me", messageQualifier);
			process.stdout.write(userInput);
		} else if (this.nicknames[userId]) {
			CmdChat.formatChat(this.nicknames[userId], data.message, userId, messageQualifier);
			process.stdout.write(userInput);
		} else {
			this.getUserInfo(userId, (ret)=>{
				if (200 == ret.statusCode) {
						const nickname_ = ret.message.nickname;

						this.nicknames[String(userId)] = nickname_;
						CmdChat.formatChat(nickname_, data.message, userId, messageQualifier);
				} else
					CmdChat.formatChat(userId, data.message, "unknown", messageQualifier);
				process.stdout.write(userInput);
			});
		}
	}

	getUserInfo(user, callback=console.log) {
		HttpsClient.get(`https://${this.host}/api/users/userinfo/${user}`, callback, this.jwt);
	}

	onLogin(jwt) {
		CmdChat.writeSystem(`Connecting to host...\n`);
		this.ws = new WebSocket('wss://' + this.host + '/ws/chat/?token=' + jwt.access);
		this.ws.on('error', console.error);
		this.ws.on('open', () => {this.onOpen()});
		this.ws.on('message', (data) => {this.onMessage(data);});
	}

	onError() {
		console.log('error'); //
	}

	openEditor() {
		if (this.editor)
			return ;
		this.editor = new TextEditor();
		this.editor.onStopKey = () => {this.#exit()};
		this.editor.setOnKeys();
		this.editor.onEnter = () => {
			process.stdout.write(`\x1b[2K\r`);
			this.#parseInput(this.editor.text);
			this.editor.text = "";
		};
	}

	onOpen() {
		HttpsClient.get(`https://${this.host}/api/users/userinfo/`, (ret)=>{
			if (200 == ret.statusCode) {
				const nickname_ = ret.message.nickname;

				this.me = ret.message.id;
				this.nicknames[String(this.me)] = nickname_;
				CmdChat.writeSystem(`Your nickname is ${nickname_}\n`);
				CmdChat.writeSystem(CmdChat.#getHelp());
				this.openEditor();
			} else {
				process.stderr.log(JSON.stringify(ret));
			}
		}, this.jwt);
	}

	onGet(ret) {
		if (200 == ret.statusCode)
			callback;
	}

	onMessage(data) {
		let data_;

		try {
			data_ = JSON.parse(data);
		} catch(e) {
			return ;
		}
		if (false === ChatMessage.isValid(data_)) {
			return ;
		} else if (!this.editor || "" == this.editor.text) {
			this.writeChat(data_);
			return ;
		}
		process.stdout.write(`\r\x1b[2K`);
		this.writeChat(data_, this.editor.text);
	}
}

// const r = new CmdChat();
// r.parser.eval();

module.exports = {
	"CmdChat": CmdChat
}
