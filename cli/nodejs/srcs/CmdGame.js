const {CmdJWT} = require("./CmdJWT");
const {Localization} = require("./Localization");
const WebSocket = require('ws'); //npm install ws
const {HttpsClient} = require("./HttpsClient");
const {TextEditor} = require("./TextEditor");
const {Controller} = require("./Controller")
const {CvsPong} = require("./CvsPong")
const {Canvas} = require("./Canvas")
const {Parser} = require("./Parser")
const {WSIPong} = require("./WSIPong")
const {TextBox} = require("./TextBox")

let l = new Localization(); //

class CmdGame extends CmdJWT {
	constructor() {
		super((jwt)=>{this.#onLoginInitialize(jwt)}, () => {return this.checkCanvas()}, "node pong-cli game");
		this.name = "game";
		this.description = "Play pong";
		this.width = 53; //Min 29
		this.height = 33; // Min 8
		this.dar = "1:1"; // * NOT IMPLEMENTED
		this.boxCanvas = undefined;
		this.dialogCanvas = undefined;
		this.pongCanvas = undefined;
		this.tournament = String(Date.now()); //
		this.newTournament = false;
		this.description = "Play Pong using keyborad arrows. Create or join tournaments."; //
		this.players = 2;
		this.parser.addOptions([
			"[--width=<width>]", 
			"[--height=<height>]",
			"[--display=<width:height>]",
			"[--tournament=<tournament>]",
			"[--create]",
			"[--players=<num_players>]",
		],[
			(match) => {this.width = Number(Parser.getOptionValue(match))}, 
			(match) => {this.height = Number(Parser.getOptionValue(match))},
			(match) => {this.dar = Parser.getOptionValue(match)},
			(match) => {this.tournament = Parser.getOptionValue(match)},
			() => {this.newTournament = true},
			(match) => {this.players = Number(Parser.getOptionValue(match))},
		]);
		this.mirror = false;
		this.controller = new Controller();
		this.wsGame = undefined;
		this.wsChat = undefined;
	}

	checkCanvas() {
		if (!this.width || 29 > this.width) {
			process.stderr.write(`Error: width must be 29 or above, received: '${this.width}'\n`);
			return 1;
		} else if (!this.height || 8 > this.height) {
			process.stderr.write(`Error: height must be 8 or above, received: '${this.height}'\n`);
			return 1;
		}
		return 0;
	}


	#initalizeController() {
		this.controller.onStopKey = () => {/*this.controller.stop();*/ this.#onStop()}; //Move at End
		this.controller.onKeys([Controller.keyArrowUp, Controller.keyArrowDown, " "], [
			() => {this.#movePaddle("up")},
			() => {this.#movePaddle("down")},
			() => {this.#sayReady()},
		]);
	}

	#mirorGame(obj) {
		[obj.player_left, obj.player_right] = [obj.player_right, obj.player_left];
		obj.ball.position[0] = WSIPong.flipXEngine(obj.ball.position[0]);
	}

	#parseGameUpdate(obj) {
		if (this.mirror)
			this.#mirorGame(obj);
		this.#onGameUpdate(()=>{this.#updateGame(obj)})
	}

	#parseCountdown(obj) {
		this.#dialog(String(obj));
	}

	#parseInit(obj) {
		const player_left = obj.player_left;
		const player_right = obj.player_right;

		if (this.me == obj.player_right.player_id)
			this.mirror = true;
		this.#dialog("Press space to start");
	}

	//WSI
	#toCanvasX(xEngine){
		return WSIPong.toXDiv(xEngine, this.pongCanvas.dx);
	}

	#toCanvasY(yEngine){
		return WSIPong.toXDiv(yEngine, this.pongCanvas.dy);
	}

	#updateGame(obj) {
		this.ballX = Number(this.#toCanvasX(obj.ball.position[0]));
		this.ballY = Number(this.#toCanvasY(obj.ball.position[1]));
		this.paddleLY = Number(this.#toCanvasY(obj.player_left.paddle_y - WSIPong.paddleLH / 2));
		this.paddleRY = Number(this.#toCanvasY(obj.player_right.paddle_y - WSIPong.paddleRH / 2));
		this.scoreL = Number(obj.player_left.score);
		this.scoreR = Number(obj.player_right.score);
	}

	//WS
	#sayReady() {
		this.wsGame.send(JSON.stringify({
			type: "ready",
			data: {direction: "ready"}
		}));
	}

	#movePaddle(d) {
		this.wsGame.send(JSON.stringify({
			type: "move_paddle",
			data: {direction: d}
		}));
	}

	#onPongMessage(data) {
		const obj = JSON.parse(data);

		// console.error("onPongMessage"); //
		console.error(obj); //
		if ("game_update" == obj.type) {
			this.#parseGameUpdate(obj.state);
		} else if ("countdown" == obj.type) {
			this.#parseCountdown(obj.data);
		} else if ("game_init" == obj.type) {
			this.#parseInit(obj.state);
		}
	}

	#onChatMessage(data) {
		const obj = JSON.parse(data);

		// console.error("onChatMessage"); //
		// console.error(obj); //
		if ("game" == obj.type) {
			const match = obj.group.match(/^user_([0-9]+)$/);

			if (!match || 2 != match.length) {
				this.#dialog("Received incorrect 'game' message from server.")
				this.#onStop();
				return ;
			}
			this.me = Number(match[1]);
			this.wsGame.send(JSON.stringify({
				type: "join",
				data: {userid: this.me, name: obj.message.slice(1, -1)}
			}));
			this.wsGame.send(JSON.stringify({
				type: "online",
				data: ""
			}));
			this.wsChat.close();
			this.wsChat = null;
		}
	}

	// steps

	#onJoinStart(ret){
		// console.error("onJoinStart"); //
		if (!ret.statusCode) {
			this.#dialog(JSON.stringify(ret));
			this.#onStop();
			return ;
		} else if (409 == ret.statusCode) {
			; //Skip is already joined
		} else if (404 == ret.statusCode) {
			this.#dialog(`Tournament '${this.tournament}' not found`);
			this.#onStop();
			return ;
		} else if (200 > ret.statusCode || 300 <= ret.statusCode) {
			this.#dialog(JSON.stringify(ret));
			this.#onStop();
			return ;
		}
		this.#startGame();
	}

	#onTournamentJoin() {
		HttpsClient.reqWithJwt(
			HttpsClient.setUrlInOptions(this.host, {method: "POST", path: "/api/tournament/join/"}),
			JSON.stringify({name: this.tournament}),
			(ret) => {this.#onJoinStart(ret)},
			this.jwt, (access) => {this.jwt.access = access}
		);
	}

	#onOpenCreateTournament() {
		if (true == this.newTournament) {
			HttpsClient.reqWithJwt(
				HttpsClient.setUrlInOptions(this.host, {method: "POST", path: "/api/tournament/create/"}),
				JSON.stringify({name: this.tournament, size: this.players}),
				(ret) => {
					if (false == HttpsClient.isStatusOk(ret.statusCode)) {
						this.#dialog(JSON.stringify(ret));
						this.#onStop();
					} else {
						this.#onTournamentJoin();
					}
				}, this.jwt, (access) => {this.jwt.access = access}
			);
		} else {
			this.#onTournamentJoin();
		}
	}

	#onLoginInitialize(jwt) {
		this.#iniCanvas();
		this.pongCanvas.update();
		this.#dialog(`Connecting to host...`); //
		this.boxCanvas.moveCursor(this.boxCanvas.dx, this.boxCanvas.dy);
		this.wsGame = new WebSocket('wss://' + this.host + '/ws/pong/?token=' + jwt.access);
		this.wsGame.on('error', (data) => {this.#dialog(String(data)); this.#onStop()});
		this.wsGame.on('open', () => {this.#onOpenCreateTournament()});
		this.wsGame.on('message', (data) => {this.#onPongMessage(data)});
		this.wsChat = new WebSocket('wss://' + this.host + '/ws/chat/?token=' + jwt.access);
		this.wsChat.on('error', (data) => {this.#dialog(String(data)); this.#onStop()});
		this.wsChat.on('message', (data) => {this.#onChatMessage(data)});
	}

	#onStop() {
		if (this.wsGame)
			this.wsGame.close();
		if (this.wsChat)
			this.wsChat.close();
		if (this.boxCanvas)
			this.boxCanvas.moveCursor(this.boxCanvas.dx - 1, this.boxCanvas.dy - 1);
		if (this.controller)
			this.controller.stop();
		process.stdout.write("\n");
		CvsPong.showCursor();
	}

	#onGameUpdate(fun = () => {}) {
		if ("" !== this.dialogCanvas.text) {
			this.#dialog("");
			this.boxCanvas.drawBox();
		}
		this.pongCanvas.update(fun);
	}

	// Controller
	#initalizeControllerDebug() {
		this.controller.onStopKey = () => {this.#onStop()};
		this.controller.onKeys([
			Controller.keyArrowUp, 
			Controller.keyArrowDown,
			Controller.keyArrowLeft,
			Controller.keyArrowRight,
			"W", "S", "A", "D",
			"8", "2", "4", "6",
		], [
			() => {this.#onGameUpdate(()=>{this.pongCanvas.paddleRY -= 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.paddleRY += 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.scoreR -= 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.scoreR += 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.paddleLY -= 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.paddleLY += 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.scoreL -= 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.scoreL += 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.ballY -= 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.ballY += 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.ballX -= 1})},
			() => {this.#onGameUpdate(()=>{this.pongCanvas.ballX += 1})},
		]);
	}


	#dialog(msg) {
		//console.error(msg); //
		this.dialogCanvas.resetText(msg);
		this.dialogCanvas.displayText();
	}

	#iniCanvas() {
		CvsPong.hideCursor();
		this.boxCanvas = new Canvas(this.width, this.height, 1, 1);
		this.boxCanvas.dx = this.width;
		this.boxCanvas.dy = this.height;
		this.boxCanvas.initalizeXY();
		this.boxCanvas.moveCursor(1, 1);
		this.boxCanvas.drawBox();
		this.boxCanvas.moveCursor(1, 1);
		this.pongCanvas = new CvsPong(this.width - 2, this.height - 2, 2, 2);
		this.pongCanvas.paddleRY = 0;
		this.pongCanvas.paddleLY = 0;
		this.pongCanvas.paddleRH = this.#toCanvasY(WSIPong.paddleRH);
		this.pongCanvas.paddleLH = this.#toCanvasY(WSIPong.paddleLH);
		this.pongCanvas.scoreL = 0;
		this.pongCanvas.scoreR = 0;
		this.pongCanvas.ballX = this.#toCanvasX(WSIPong.ballX0);
		this.pongCanvas.ballY = this.#toCanvasY(WSIPong.ballY0);
		this.pongCanvas.initalize();
		//
		const c = new Canvas(this.width, 1, 1, 1);

		this.dialogCanvas = new TextBox(c);
	}

	#startGame() {
		this.#iniCanvas();
		this.#dialog(`Tournament="${this.tournament}" Waiting for players... `);
		this.#initalizeController();
		// this.wsGame.send(JSON.stringify({
		// 	type: "online",
		// 	data: ""
		// }));
		//this.#initalizeControllerDebug();
	}
}

// 	const c = new Controller();
// 	c.onKeys([Controller.keyEnter], [printLol], console.log);
// 	c.stop = encore;
// }


// const r = new CmdGame();
// r.parser.eval();

module.exports = {
	"CmdGame": CmdGame
}
