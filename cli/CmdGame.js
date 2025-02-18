const {CmdJWT} = require("./CmdJWT");
const WebSocket = require('ws'); //npm install ws
const {HttpsClient} = require("./HttpsClient");
const {Controller} = require("./Controller")
const {CvsPong} = require("./CvsPong")
const {Canvas} = require("./Canvas")
const {Parser} = require("./Parser")
const {WSIPong} = require("./WSIPong")
const {TextBox} = require("./TextBox");
const {ApiPong} = require("./ApiPong");

class CmdGame extends CmdJWT {
	constructor() {
		super((jwt)=>{this.#onLoginInitialize(jwt)}, () => {return this.#checkProperties()}, "node pong-cli game");
		this.name = "game";
		this.description = "Play Pong using keyboard arrows. Create or join tournaments."; //
		this.width = 103; //Min 29
		this.height = 28; // Min 8
		//this.dar = "1:1"; // * NOT IMPLEMENTED
		this.boxCanvas = undefined;
		this.dialogCanvas = undefined;
		this.pongCanvas = undefined;
		this.tournament = undefined;
		this.newTournament = false;
		
		this.players = 2;
		this.parser.addOptions([
			"[--width=<width>]", 
			"[--height=<height>]",
			//"[--display=<width:height>]",
			"[--tournament=<tournament>]",
			"[--create]",
			"[--players=<num_players>]",
		],[
			(match) => {this.width = Number(Parser.getOptionValue(match))}, 
			(match) => {this.height = Number(Parser.getOptionValue(match))},
			//(match) => {this.dar = Parser.getOptionValue(match)},
			(match) => {this.tournament = Parser.getOptionValue(match)},
			() => {this.newTournament = true},
			(match) => {this.players = Number(Parser.getOptionValue(match))},
		]);
		this.mirror = false;
		this.controller = new Controller();
		this.wsGame = undefined;
		this.wsChat = undefined;
		this.me = undefined;
		this.opponent = undefined;
		this.opponentName = undefined;
		this.playerNames = undefined; //
		this.askready = false;
	}

	#checkProperties() {
		if (false == this.newTournament && !this.tournament) {
			process.stderr.write(`Error: expected tounament name. Use --tournament=<name>'\n`);
			return 1;
		} else if (!this.width || 29 > this.width) {
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
		this.controller.onKeys([Controller.keyArrowUp, Controller.keyArrowDown, " ", "R"], [
			() => {this.#movePaddle("up")},
			() => {this.#movePaddle("down")},
			() => {this.#sayReady()},
			() => {this.#redrawCanvas()},
		]);
	}

	#mirorGame(obj) {
		[obj.player_left, obj.player_right] = [obj.player_right, obj.player_left];
		obj.ball.position[0] = WSIPong.flipXEngine(obj.ball.position[0]);
	}

	#parseGameState(obj) {
		//console.error(obj); //
		if (this.mirror)
			this.#mirorGame(obj);
		this.#onGameUpdate(()=>{this.#updateGame(obj)})
	}

	#parseCountdown(obj) {
		this.#dialog(String(obj));
	}

	#parseInit(state) {
		//console.log(state); //
		if (!state.player_right || !state.player_right)
			return ;
		if (this.me == state.player_right.playerid) {
			this.mirror = true;
			this.opponent = state.player_left.playerid;
		} else if (this.me == state.player_left.playerid) {
			this.mirror = false;
			this.opponent = state.player_right.playerid;
		} else {
			this.mirror = false;
			this.#parseGameState(state);
			this.#dialog("[space] to start, Arroys to move.");
			this.askready = true;
			return ;
		}
		this.opponentName = (this.playerNames) ? this.playerNames[String(this.opponent)] : null;
		this.#parseGameState(state);
		this.#dialog("[space] to start, Arroys to move. You are on the left.");
		this.askready = true;
	}

	#onMatchResult(ret) {
		if (!ret || false == HttpsClient.isStatusOk(ret.statusCode) || !ret.message.status) {
			this.#dialog("Failed to retreive tournament details. Wait or quit.");
		} else if (2 == ret.message.status) {
			this.#dialog("Tournament Victory!");
			this.#onStop();
		} else if (1 == ret.message.status) {
			this.#dialog("Waiting for next tournament game...");
		} else {
			this.#dialog(`Unexpected tournament status:${ret.message.status}. Wait or quit.`);
		}
	}

	#onVictory() {
		this.#dialog("Game Won");
		ApiPong.getTournamentDetails(
			HttpsClient.setUrlInOptions(this.host),
			this.tournament,
			(ret) => {this.#onMatchResult(ret)},
			this.jwt,
			(access) => {this.jwt.access = access}
		);
	}

	#onLoss() {
		this.#dialog("Game lost");
		this.#onStop();
	}

	#parseOver(state) {
		if (this.me == state.winner) {
			this.#onVictory();
		} else {
			this.#onLoss();
		}
		this.opponent = null;
		this.opponentName = null;
	}

	//WSI
	#toCanvasX(xEngine){
		return WSIPong.toXDiv(xEngine, 2 * this.pongCanvas.dx);
	}

	#toCanvasY(yEngine){
		return WSIPong.toYDiv(yEngine, 2 * this.pongCanvas.dy);
	}

	#updateGame(obj) {
		//console.error(this); //
		this.pongCanvas.ballX = Number(this.#toCanvasX(obj.ball.position[0]));
		this.pongCanvas.ballY = Number(this.#toCanvasY(obj.ball.position[1]));
		this.pongCanvas.paddleLY = Number(this.#toCanvasY(obj.player_left.paddle_y - WSIPong.paddleLH / 2));
		this.pongCanvas.paddleRY = Number(this.#toCanvasY(obj.player_right.paddle_y - WSIPong.paddleRH / 2));
		this.pongCanvas.scoreL = Number(obj.player_left.score);
		this.pongCanvas.scoreR = Number(obj.player_right.score);
		//console.error(obj); //
		//console.error(this); //
	}

	//WS
	#sayReady() {
		this.wsGame.send(JSON.stringify({
			type: "ready",
			data: {direction: "ready"}
		}));
		if (true == this.askready) {
			this.askready = false;
			if (this.opponentName) {
				this.#dialog(`Waiting for ${this.opponentName}...`);
			} else {
				this.#dialog("Waiting for game players...");
			}
		}
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
		//console.error(obj); //
		if ("game_update" == obj.type) {
			this.#parseGameState(obj.state);
		} else if ("countdown" == obj.type) {
			this.#parseCountdown(obj.data);
		} else if ("game_init" == obj.type) {
			this.#parseInit(obj.state);
		} else if ("game_over" == obj.type) {
			this.#parseOver(obj.state);
		}
	}

	#onUserinfoSetName(ret) {
		//console.error(ret);
		if (
			HttpsClient.isStatusOk(ret.statusCode)
			&& ret.message 
			&& ret.message.nickname
			&& ret.message.id
		) {
			if (!this.playerNames) {
				this.playerNames = {};
			}
			this.playerNames[String(ret.message.id)] = String(ret.message.nickname);
		}
		//console.error(this.playerNames);
	}

	#onTournamentDetailsGetNames(ret) {
		if (
			HttpsClient.isStatusOk(ret.statusCode)
			&& ret.message 
			&& ret.message.players
		) {
			for (const playerId of ret.message.players) {
				if (playerId != this.me) {
					ApiPong.getUserInfo(
						HttpsClient.setUrlInOptions(this.host), 
						playerId,
						(ret) => {this.#onUserinfoSetName(ret)},
						this.jwt, (access) => {this.jwt.access = access}
					)
				}
			}
		}
	}

	#onChatMessage(data) {
		const obj = JSON.parse(data);

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
			if (!this.playerNames) {
				ApiPong.getTournamentDetails(
					HttpsClient.setUrlInOptions(this.host), 
					this.tournament,
					(ret) => {this.#onTournamentDetailsGetNames(ret)},
					this.jwt, (access) => {this.jwt.access = access}
				)
			}
			// this.wsChat.close();
			// this.wsChat = null;
		}
	}

	// steps

	#onJoinStart(ret) {
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
		if (!this.tournament) {
			this.#dialog("Missing tournament name. Use --tournament=<name>");
			this.#onStop();
		}
		ApiPong.joinTournament(
			HttpsClient.setUrlInOptions(this.host), 
			this.tournament,
			(ret) => {this.#onJoinStart(ret)},
			this.jwt, (access) => {this.jwt.access = access}
		);
	}

	#getRandomTournamentName() {
		const name = Date.now().toString(36).toLowerCase()
			.replace("l","A")
			.replace("1","B")
			.replace("0", "C");

		if (16 < name.length)
			return name.substring(name.length - 16);
		return name;
	}

	#onOpenCreateTournament() {
		if (true == this.newTournament) {
			if (!this.tournament) {
				this.tournament=this.#getRandomTournamentName();
			}
			ApiPong.createTournament(
				HttpsClient.setUrlInOptions(this.host),
				this.tournament, this.players,
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
		let wsOpened = 0;
		const onOpen = () => {
			wsOpened++;
			if (2 == wsOpened) {
				this.#onOpenCreateTournament();
			}
		}

		this.#iniCanvas();
		this.pongCanvas.update();
		this.#dialog(`Connecting to host...`); //
		this.boxCanvas.moveCursor(this.boxCanvas.dx, this.boxCanvas.dy);
		this.wsGame = new WebSocket('wss://' + this.host + '/ws/pong/?token=' + jwt.access);
		this.wsGame.on('error', (data) => {this.#dialog(String(data)); this.#onStop()});
		this.wsGame.on('open', () => {onOpen()});
		this.wsGame.on('message', (data) => {this.#onPongMessage(data)});
		this.wsChat = new WebSocket('wss://' + this.host + '/ws/chat/?token=' + jwt.access);
		this.wsChat.on('error', (data) => {this.#dialog(String(data)); this.#onStop()});
		this.wsChat.on('open', () => {onOpen()});
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

	#redrawCanvas() {
		this.boxCanvas.moveCursor(0, 0);
		this.boxCanvas.clearRec();
		this.boxCanvas.moveCursor(1, 1);
		this.boxCanvas.drawBox();
		this.pongCanvas.moveCursor(0, 0);
		this.pongCanvas.clearRec();
		this.pongCanvas.update(() => {});
		//this.dialogCanvas.displayText();
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
		this.pongCanvas.scoreL = 0;
		this.pongCanvas.scoreR = 0;
		this.pongCanvas.paddleRH = this.#toCanvasY(WSIPong.paddleRH);
		this.pongCanvas.paddleLH = this.#toCanvasY(WSIPong.paddleLH);
		this.pongCanvas.paddleRX = this.#toCanvasX(WSIPong.paddleRX);
		this.pongCanvas.paddleLX = this.#toCanvasX(WSIPong.paddleLX);
		this.pongCanvas.ballX = this.#toCanvasX(WSIPong.ballX0);
		this.pongCanvas.ballY = this.#toCanvasY(WSIPong.ballY0);
		this.pongCanvas.initalize();
		//
		const c = new Canvas(this.width, 1, 1, 1);

		this.dialogCanvas = new TextBox(c);
	}

	#startGame() {
		this.#iniCanvas();
		this.#dialog(`Tournament="${this.tournament}" Waiting for tounament players... `);
		this.#initalizeController();
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
