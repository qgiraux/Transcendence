const {JWTCmd} = require("./JWTCmd");
const {Localization} = require("./Localization");
const WebSocket = require('ws'); //npm install ws
const {HttpsClient} = require("./HttpsClient");
const {TextEditor} = require("./TextEditor");

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

	static writeSystem(message) {
		process.stdout.write(`info: ${message}`);
	}

	static formatChat(nickname, message, nickQualifier) {
		if ("\n" != message.slice(-1))
			message += "\n";
		let out = "";

		out += `\x1b[1;36m${nickname}\x1b[0m`;
		if (nickQualifier)
			out += `(${nickQualifier})`;
		out += `: ${message}`;
		process.stdout.write(out);
	}

	writeChat(data) {
		if ("chat" != data.type)
			return ;
		if (this.me != -1 && this.me == data.sender)
			CmdChat.formatChat(this.nicknames[this.me], data.message, "me");
		else if (this.nicknames[data.sender])
			CmdChat.formatChat(this.nicknames[data.sender], data.message);
		else
		{
			this.getUserInfo(data.sender, (ret)=>{
				if (200 == ret.statusCode)
					{
						const nickname_ = ret.message.nickname;

						this.nicknames[String(data.sender)] = nickname_;
						CmdChat.formatChat(nickname_, data.message);
					}
				else
					CmdChat.formatChat(data.sender, data.message, "unknown");
			});
		}
	}

	getUserInfo(user, callback=console.log) {
		HttpsClient.get(`https://${this.host}/api/users/userinfo/${user}`, callback, this.jwt);
	}

	onLogin(jwt) {
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
		this.editor = new TextEditor((text) => {
			process.stdout.write(`\x1b[2K\r`); //
			this.ws.send(ChatMessage.toJsonString("chat", text, "global_chat")); //
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
				this.ws.send(ChatMessage.toJsonString("chat", "hello there", "global_chat")); //
				this.openEditor();
			}
			else
				console.log("error"); //
		}, this.jwt);
	}

	onGet(ret) {
		if (200 == ret.statusCode)
			callback;
	}

	onMessage(data) {
		const data_ = JSON.parse(data);

		if (!this.editor || "" == this.editor.text) // ???
		{
			this.writeChat(data_);
			return ;
		}
		process.stdout.write(`\x1b[2K\r`);
		this.writeChat(data_);
		process.stdout.write(this.editor.text);
		//msg.getSenderHuman("https://" + this.host);
		//process.stdout.write(msg.toJsonString());

		// const data_ = JSON.parse(data);

		// if ("\n" != data_.message.slice(-1))
		// 	data_.message += "\n";

		// const isGlobal = ("global_chat" == data_.group);

		// HttpsClient.get("", )
		// process.stdout.write(`${data_.type}:${data_.group}:${data_.sender}:${data_.message}`);
		//process.stdout.write(JSON.parse(data)); //
		//process.stdout.write(data);
		//console.log(JSON.parse(data));
	}
}

const r = new CmdChat();
r.parser.eval();
