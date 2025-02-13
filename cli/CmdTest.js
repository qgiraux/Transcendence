const {WSIPong} = require("./WSIPong");
const {ApiPong} = require("./ApiPong");
const {HttpsClient} = require("./HttpsClient");
const {Command} = require("./Command");
const {Parser} = require("./Parser");
const WebSocket = require('ws'); //npm install ws

class CmdTest extends Command {
	constructor(options) {
		super("Start an auto-resolved game with the given option and a log.", "node pong-cli test");
		if (!options)
			options = {}
		this.name = "test";
		this.host = options.host || "localhost";
		this.port = options.port || 5000;
		this.jwt = undefined;
		this.userName = options.userName;
		this.password = options.password;
		this.wsPong = undefined;
		this.wsChat = undefined;
		this.log = (context, data) => {console.log(String(context), String(data))};
		this.me = undefined;
		this.tournamentName = options.tournamentName;
		this.tournamentSize = undefined;
		this.newTournament = false;

		this.parser.setOptions([
			"[--help]", 
			"[--login=<login>]", 
			"[--password=<password>]", 
			"[--host=<host>]", 
			"[--port=<port>]",
			"[--tournament=<tournament>]",
			"[--create]",
			"[--players=<num_players>]",
		],[
			()=>{this.parser.displayHelp = true;}, 
			(match) => {this.userName = String(Parser.getOptionValue(match))}, 
			(match) => {this.password = String(Parser.getOptionValue(match))}, 
			(match) => {this.host = String(Parser.getOptionValue(match))}, 
			(match) => {this.port = Number(Parser.getOptionValue(match))}, 
			(match) => {this.tournamentName = String(Parser.getOptionValue(match))}, 
			() => {this.newTournament = true},
			(match) => {this.tournamentSize = Number(Parser.getOptionValue(match))}, 
		]);
		this.parser.defaultCallback = () => {
			HttpsClient.enableDebug();
			if (true == this.newTournament) {
				this.testCreate();
			} else {
				this.testJoin();
			}
		};
	}

	#exit() {
		if (this.wsPong)
			this.wsPong.close();
		this.wsPong = null;
		if (this.wsChat)
			this.wsChat.close();
		this.wsChat = undefined;
	}

	#login(nextStep) {
		const onRet = (ret) => {
			const statusCode = Number(ret.statusCode);

			if (200 <= statusCode && 300 > statusCode)
			{
				this.jwt = ret.message;
				nextStep(); //
			}
		};
		ApiPong.login({host: this.host, port: this.port}, this.userName, this.password, onRet);
	}

	#openWS() {
		this.wsPong = new WebSocket(`wss://${this.host}:${this.port}/ws/pong/?token=${this.jwt.access}`);
		this.wsPong.on('error', (data) => {this.log('O: pong: ws: error: ', data); this.#exit()});
		this.wsPong.on('open', () => {this.log('O: pong: ws: open: ', "")});
		this.wsPong.on('message', (data) => {this.log('O: pong: ws: message: ', data); this.#onPongMessage(data)});
		this.wsChat = new WebSocket(`wss://${this.host}:${this.port}/ws/chat/?token=${this.jwt.access}`);
		this.wsChat.on('error', (data) => {this.log('O: chat: ws: error: ', data); this.#exit()});
		this.wsChat.on('open', () => {this.log('O: chat: ws: open: ', "")});
		this.wsChat.on('message', (data) => {this.log('O: chat: ws: message: ', data); this.#onChatMessage(data)});
	}

	#wsChatSend(data) {
		const s = JSON.stringify(data);
		this.log("I: ws: pong: ", s);
		this.wsChat.send(s);
	}

	#wsPongSend(data) {
		const s = JSON.stringify(data);
		this.log("I: ws: pong: ", s);
		this.wsPong.send(s);
	}

	#onChatMessage(data) {
		const obj = JSON.parse(data);

		if ("game" == obj.type) {
			const match = obj.group.match(/^user_([0-9]+)$/);

			this.me = Number(match[1]);
			this.#wsPongSend({
				type: "join",
				data: {userid: this.me, name: obj.message.slice(1, -1)}
			});
			this.#wsPongSend({
				type: "online",
				data: ""
			});
		}
	}

	#onPongMessage(data) {
		const obj = JSON.parse(data);

		if ("game_update" == obj.type) {
			;
		} else if ("countdown" == obj.type) {
			;
		} else if ("game_init" == obj.type) {
			this.#wsPongSend({
				type: "ready",
				data: ""
			});
		} else if ("game_over" == obj.type) {
			;
		}
	}

	#joinTournament() {
		ApiPong.joinTournament(
			{host: this.host, port: this.port},
			this.tournamentName,
			() => {},
			this.jwt, (access) => {this.jwt.access = access}
		);
	}

	#createTournament(nextStep) {
		ApiPong.createTournament(
			{host: this.host, port: this.port},
			this.tournamentName, this.tournamentSize,
			() => {},
			this.jwt, (access) => {this.jwt.access = access}
		);
	}

	testJoin() {
		this.log("test:", JSON.stringify(this));
		const onLogin = () => {this.#openWS(); this.#joinTournament()};
		this.#login(onLogin);
	}

	testCreate(tournamentSize) {
		if (tournamentSize)
			this.tournamentSize = tournamentSize;
		this.log("test:", JSON.stringify(this));
		const onLogin = () => {this.#openWS(); this.#createTournament()};
		this.#login(onLogin);
	}
}

module.exports = {
	"CmdTest": CmdTest
}

// const t = new CmdTest({});
// HttpsClient.allowSelfSigned();
// t.parser.eval();
