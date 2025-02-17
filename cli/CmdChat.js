const {CmdJWT} = require("./CmdJWT");
const WebSocket = require('ws'); //npm install ws
const {HttpsClient} = require("./HttpsClient");
const {TextEditor} = require("./TextEditor");
const {ApiPong} = require("./ApiPong");

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
}

class CmdChat extends CmdJWT {
	constructor() {
		super((jwt)=>{this.#onLogin(jwt);});
		this.name = "chat";
		this.description = "Enter chat, get easy access to the API and WS endpoints.";
		this.setUsage("pong-cli chat");
		this.nicknames = {};
		this.blocklist = [];
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
			+ "\x1b[1m" + "!profile [<userId>]" + "\x1b[0m " + "View user profile\n"
			+ "\x1b[1m" + "!api get <path>" + "\x1b[0m " + "Send Get Https Request to Pong Endpoints\n"
			+ "\x1b[1m" + "!api post <path> <json>" + "\x1b[0m " + "Send Post Https Request to Pong Endpoints\n"
			+ "\x1b[1m" + "!ws [chat | invite | <type>] [user_<userId> | global_chat | <group>] <message>" + "\x1b[0m " + "Send WS message\n"
			+ "\x1b[1m" + "!![<message>]" + "\x1b[0m " + "Sends ![<message>]\n"
			+ "\x1b[1m" + "!exit" + "\x1b[0m " + "Leave Chat\n"
			+ "_____________________________________________________________________________________________\n"
		;
	}

	//CMDS
	#help() {
		process.stdout.write(CmdChat.#getHelp());
	}

	#block(words) {
		if (!words || "block" != words[0]) {
			;
		} else if (!words[1]) {
			CmdChat.writeSystem(`missing <userId>'\n`);
		} else {
			const userId = Number(words[1]);

			if (userId == this.me) {
				;
			} else {
				if (false == this.blocklist.includes(userId))
					this.blocklist.push(userId);
				ApiPong.block(
					HttpsClient.setUrlInOptions(this.host),
					userId, 
					(ret)=>{CmdChat.#writeResponse(ret)}, 
					this.jwt, (access) => {this.jwt.access = access}
				)
			}
		}
	}

	#unblock(words) {
		if (!words || "unblock" != words[0]) {
			;
		} else if (!words[1]) {
			CmdChat.writeSystem(`missing <userId>'\n`);
		} else {
			const userId = Number(words[1]);
			const index = this.blocklist.indexOf(userId);

			if (-1 != index > -1)
				this.blocklist.splice(index, 1);
			ApiPong.unblock(
				HttpsClient.setUrlInOptions(this.host),
				userId, 
				(ret)=>{CmdChat.#writeResponse(ret)}, 
				this.jwt, (access) => {this.jwt.access = access}
			)
		}
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
		if (!words || "profile" != words[0])
			return ;
		const userId = (words[1]) ? Number(words[1]) : Number(this.me);
		let profile = {};

		const updateProfile = (ret, field) => {
			if (HttpsClient.isStatusOk(ret.statusCode))
				profile[field] = ret.message;
			else
				profile[field] = "/";
			if (profile.userinfo && profile.userstats)
				process.stdout.write(`${JSON.stringify(profile, null, " ")}\n`);
		}
		const getField = (field) => {
			HttpsClient.reqWithJwt(
				HttpsClient.setUrlInOptions(this.host, {method: "GET", path: `/api/users/${field}/${userId}`}), 
				null, 
				(ret)=>{updateProfile(ret, field)}, 
				this.jwt, (access) => {this.jwt.access = access}
			);
		};

		getField("userinfo");
		getField("userstats");
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
			HttpsClient.reqWithJwt(
				HttpsClient.setUrlInOptions(this.host, {method: "GET", path: words[2]}), 
				null, 
				(ret)=>{CmdChat.#writeResponse(ret)}, 
				this.jwt, (access) => {this.jwt.access = access}
			);
		} else if ("post" == words[1]) {
			HttpsClient.reqWithJwt(
				HttpsClient.setUrlInOptions(this.host, {method: "POST", path: words[2]}), 
				words.slice(3).join(" "), 
				(ret)=>{CmdChat.#writeResponse(ret)}, 
				this.jwt, (access) => {this.jwt.access = access}
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
		const message = (!!words[3]) ? words.slice(3).join(" ") : "";

		this.ws.send(ChatMessage.toJsonString(words[1], message, words[2], -1));
	}

	#direct(words) {
		const user = words[1];

		if (!user)
		{
			CmdChat.writeSystem(`missing <userId>\n`);
			return ;
		}
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
			(w)=>{this.#block(w)},
			(w)=>{this.#unblock(w)},
			(w)=>{this.#invite(w)},
			(w)=>{this.#profile(w)},
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

	static #writeResponse(jsonResponse) {
		if (typeof jsonResponse != "object") {
			process.stdout.write(String(jsonResponse));
			return ;
		}
		let pretty = new String("Status code: ");

		if (HttpsClient.isStatusOk(jsonResponse.statusCode))
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
			ApiPong.getUserInfo(
				HttpsClient.setUrlInOptions(this.host),
				user,
				(ret) => {
					if (200 == ret.statusCode) {
							const nickname_ = ret.message.nickname;
	
							this.nicknames[String(userId)] = nickname_;
							CmdChat.formatChat(nickname_, data.message, userId, messageQualifier);
					} else
						CmdChat.formatChat(userId, data.message, "unknown", messageQualifier);
					process.stdout.write(userInput);
				}, this.jwt, (access) => {this.jwt.access = access}
			);
		}
	}

	#onBlocklist(ret) {
		if (false == HttpsClient.isStatusOk(ret.statusCode)) {
			CmdChat.#writeResponse(ret);
			return ;
		} else {
			this.blocklist = ret.message.blocks;
			CmdChat.writeSystem(`Connecting to host via Websocket...\n`);
			this.ws = new WebSocket('wss://' + this.host + '/ws/chat/?token=' + this.jwt.access);
			this.ws.on('error', console.error);
			this.ws.on('open', () => {this.onOpen()});
			this.ws.on('message', (data) => {this.onMessage(data);});
		}
	}

	#onLogin(jwt) {
		CmdChat.writeSystem(`Obtaining block list...\n`);
		ApiPong.getBlockList(
			HttpsClient.setUrlInOptions(this.host),
			(ret) => {this.#onBlocklist(ret)}, 
			jwt, (access) => {this.jwt.access = access}
		);
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
		ApiPong.getUserInfo(
			HttpsClient.setUrlInOptions(this.host), 
			null, 
			(ret) => {
				if (HttpsClient.isStatusOk(ret.statusCode)) {
					const nickname_ = ret.message.nickname;
	
					this.me = ret.message.id;
					this.nicknames[String(this.me)] = nickname_;
					CmdChat.writeSystem(`Your nickname is ${nickname_}\n`);
					CmdChat.writeSystem(CmdChat.#getHelp());
					this.openEditor();
				} else {
					process.stderr.log(JSON.stringify(ret));
				}
			}, this.jwt, (access) => {this.jwt.access = access}
		);
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
		} else if (this.me != data_.sender && this.blocklist.includes(data_.sender)) {
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
