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

		/** @type {String}*/
		this.senderHuman = "";
	}

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
		this.nicknames = {};
		this.me = -1;
		this.editor = undefined;
	}

	// static #colorUser(userName, userId){
	// 	const min = 17;
	// 	const max = 231;

	// 	return min
	// 		+ (String(userName).charCodeAt(0) + Number(userId)) % (max - min);
	// }

	#unknown(words) {
		CmdChat.writeSystem(`unknown command '${words[0]}'\n`);
		this.#help();
	}

	#help() {
		CmdChat.writeSystem(CmdChat.#getHelp());
	}

	#direct(words) {
		const user = words[1];

		if (!user)
			return ;
		const message = words.slice(2).join(" ");
		const dest = this.nicknames[user];

		if (!!dest)
			CmdChat.formatChat(this.nicknames[this.me], message, "me", `to ${dest}[${user}]`);
		else
			CmdChat.formatChat(this.nicknames[this.me], message, "me", `to [${user}]`);
		if (user != this.me)
			this.ws.send(ChatMessage.toJsonString("chat", message, `user_${user}`));
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
		let cmdId = 1 + ["help", "direct", "block", "unblock", "invite", "profile"
			].indexOf(command);
		const cmdFun = [
			(w)=>{this.#unknown(w)},
			(w)=>{this.#help()},
			(w)=>{this.#direct(w)},
			(w)=>{this.#help(w)}, //#TODO
			(w)=>{this.#help(w)}, //#TODO
			(w)=>{this.#help(w)}, //#TODO
			(w)=>{this.#help(w)}, //#TODO
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

	static #getHelp() {
		return "You may only type printable ASCII characters.\n"
			+ "Controls:\n"
			+ "[↵] Post [⌫] Remove typed character [^C/^D] Exit\n"
			+ "Commands:\n"
			+ "\x1b[1m" + "!help" + "\x1b[0m " + "Prints this message\n"
			+ "\x1b[1m" + "!direct <userId> <message>" + "\x1b[0m " + "Sends a direct message\n"
			+ "\x1b[1m" + "!block <userId>" + "\x1b[0m " + "Blocks user\n"
			+ "\x1b[1m" + "!unblock <userId>" + "\x1b[0m " + "Unblocks user\n"
			+ "\x1b[1m" + "!invite <userId>" + "\x1b[0m " + "Invite user to a game\n"
			+ "\x1b[1m" + "!profile <userId>" + "\x1b[0m " + "View user profile\n"
			+ "\x1b[1m" + "!!<message>" + "\x1b[0m " + "Sends !<message>\n"
		;
	}

	static writeSystem(message) {
		process.stdout.write(`info: ${message}`);
	}

	static formatChat(nickname, message, nickQualifier, messageQualifier) {
		if ("\n" != message.slice(-1))
			message += "\n";
		let out = "";

		out += `\x1b[1;36m${nickname}\x1b[0m`;
		if (nickQualifier)
			out += `[${nickQualifier}]`;
		out += `: `;
		if (messageQualifier)
			out += `(\x1b[3m${messageQualifier}\x1b[0m): `;
		out += message;
		process.stdout.write(out);
	}

	writeChat(data, userInput="") {
		const messageQualifier = ("chat" == data.type) ? undefined : data.type;
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
						CmdChat.formatChat(nickname_, data.message, userId);
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
		this.ws = new WebSocket('wss://' + this.host + '/ws/chat/?token=' + jwt.access); //wss://{{host}}/ws/chat/?token={{access}};
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
		this.editor.onStopKey = () => {
			this.ws.close();
			CmdChat.writeSystem(`Left chat\n`);
		};
		this.editor.setOnKeys((text) => {
			process.stdout.write(`\x1b[2K\r`); //
			//this.ws.send(ChatMessage.toJsonString("chat", text, "global_chat")); //
			this.#parseInput(text);
			this.editor = undefined;
			this.openEditor();
		}, TextEditor.echo);
	}

	onOpen() {
		HttpsClient.get(`https://${this.host}/api/users/userinfo/`, (ret)=>{
			if (200 == ret.statusCode)
			{
				const nickname_ = ret.message.nickname;

				this.me = ret.message.id;
				this.nicknames[String(this.me)] = nickname_;
				CmdChat.writeSystem(`Your nickname is ${nickname_}\n`);
				CmdChat.writeSystem(CmdChat.#getHelp());
				this.ws.send(ChatMessage.toJsonString("chat", "hello there", "global_chat")); //
				this.openEditor();
			}
			else
				process.stderr.log(JSON.stringify(ret)); //
		}, this.jwt);
	}

	onGet(ret) {
		if (200 == ret.statusCode)
			callback;
	}

	onMessage(data) {
		const data_ = JSON.parse(data);

		if (!this.editor || "" == this.editor.text)
		{
			this.writeChat(data_);
			return ;
		}
		process.stdout.write(`\r\x1b[2K`);
		this.writeChat(data_, this.editor.text);
	}
}

const r = new CmdChat();
r.parser.eval();
