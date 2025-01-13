const {JWTCmd} = require("./JWTCmd");
const {Localization} = require("./Localization");
const WebSocket = require('ws'); //npm install ws
const {HttpsClient} = require("./HttpsClient");
const {TextEditor} = require("./TextEditor");
const {Controller} = require("./Controller")
const {CvsPong} = require("./CvsPong")
const {Canvas} = require("./Canvas")
const {Parser} = require("./Parser")

let l = new Localization(); //


class PongEngine {
	static width = 120;
	static height = 100;
	static paddleLX = 10;
	static paddleRX = 110;
	static paddleLH = 10;
	static paddleRH = 10;
	static ballX0 = 50;
	static ballY0 = 50;

	static flipXEngine(xEngine) {
		return (PongEngine.width - xEngine);
	}

	static toXDiv(xEngine, xDivMax) {
		return (Math.floor(xEngine * xDivMax / PongEngine.width));
	}

	static toYDiv(xEngine, xDivMax) {
		return (Math.floor(xEngine * xDivMax / PongEngine.height));
	}
}

class CmdPong extends JWTCmd {
	constructor() {
		super((jwt)=>{this.#onLogin(jwt)}, () => {return this.checkCanvas()}, "node pong-cli pong");
		this.width = 53; //Min 29
		this.height = 33; // Min 8
		this.dar = "1:1"; // * NOT IMPLEMENTED
		this.boxCanvas = undefined;
		this.pongCanvas = undefined;
		this.tournament = String(Date.now()); //
		this.newTournament = false;
		this.description = "Play Pong."; //
		this.parser.addOptions([
			"[--width=<width>]", 
			"[--height=<height>]",
			"[--display=<width:height>]",
			"[--tournament=<tournament>]",
			"[--create]"
		],[
			(match) => {this.width = Number(Parser.getOptionValue(match))}, 
			(match) => {this.height = Number(Parser.getOptionValue(match))},
			(match) => {this.dar = Parser.getOptionValue(match)},
			(match) => {this.tournament = Parser.getOptionValue(match)},
			() => {this.newTournament = true}
		]);
		this.mirror = false;
		this.controller = new Controller();
		this.ws = undefined;
	}

	#movePaddle(d) {
		this.ws.send(JSON.stringify({
			type: "move_paddle",
			data: {direction: d}
		}));
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

	#initalizeControllerDebug() {
		this.controller.onStopKey = () => {CvsPong.showCursor(); this.ws.close()}; //Move at End
		this.controller.onKeys([
			Controller.keyArrowUp, 
			Controller.keyArrowDown,
			Controller.keyArrowLeft,
			Controller.keyArrowRight,
			"W", "S", "A", "D",
			"8", "2", "4", "6",
		], [
			() => {this.pongCanvas.update(()=>{this.pongCanvas.paddleRY -= 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.paddleRY += 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.scoreR -= 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.scoreR += 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.paddleLY -= 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.paddleLY += 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.scoreL -= 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.scoreL += 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.ballY -= 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.ballY += 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.ballX -= 1})},
			() => {this.pongCanvas.update(()=>{this.pongCanvas.ballX += 1})},
		]);
	}

	#initalizeController() {
		this.controller.onStopKey = () => {CvsPong.showCursor(); this.ws.close()}; //Move at End
		this.controller.onKeys([Controller.keyArrowUp, Controller.keyArrowDown], [
			() => {this.pongCanvas.update(()=>{this.#movePaddle("up")})},
			() => {this.pongCanvas.update(()=>{this.#movePaddle("down")})},
		]);
	}

	#onLogin(jwt) {
		process.stdout.write(`Connecting to host...\n`); //
		this.ws = new WebSocket('wss://' + this.host + '/ws/pong/?token=' + jwt.access); //wss://{{host}}/ws/chat/?token={{access}};
		this.ws.on('error', console.error);
		this.ws.on('open', () => {this.#onOpen()});
		this.ws.on('message', (data) => {this.#onMessage(data)});
	}

	#onOpen() {
		this.#startGame();
	}

	#toCanvasX(xEngine){
		return PongEngine.toXDiv(xEngine, this.pongCanvas.dx);
	}

	#toCanvasY(yEngine){
		return PongEngine.toXDiv(yEngine, this.pongCanvas.dy);
	}

	#updateGame(obj) {
		this.ballX = Number(this.#toCanvasX(obj.ball.position[0]));
		this.ballY = Number(this.#toCanvasY(obj.ball.position[1]));
		this.paddleLY = Number(this.#toCanvasY(obj.player_left.paddle_y));
		this.paddleRY = Number(this.#toCanvasY(obj.player_right.paddle_y));
		this.scoreL = Number(obj.player_left.score);
		this.scoreR = Number(obj.player_right.score);
	}

	#mirorGame(obj) {
		[obj.player_left, obj.player_right] = [obj.player_right, obj.player_left];
		obj.ball.position[0] = PongEngine.flipXEngine(obj.ball.position[0]);
	}

	#onMessage(data) {
		const data_ = JSON.parse(data);

		if (this.mirror)
			this.#mirorGame(obj);
		this.#updateGame(obj);
	}

	#startGame() {
		CvsPong.hideCursor();
		this.boxCanvas = new Canvas(this.width, this.height, 1, 1);
		this.boxCanvas.dx = this.width;
		this.boxCanvas.dy = this.height;
		this.boxCanvas.initalizeXY();
		this.boxCanvas.moveCursor(1, 1);
		this.boxCanvas.drawBox();
		this.boxCanvas.moveCursor(1, 1);
		//
		this.pongCanvas = new CvsPong(this.width - 2, this.height - 2, 2, 2);
		//
		this.pongCanvas.paddleRY = 0; //
		this.pongCanvas.paddleLY = 0; //
		this.pongCanvas.paddleRH = this.#toCanvasY(PongEngine.paddleRH);
		this.pongCanvas.paddleLH = this.#toCanvasY(PongEngine.paddleLH);
		this.pongCanvas.scoreL = 0;
		this.pongCanvas.scoreR = 0;
		this.pongCanvas.ballX = this.#toCanvasX(PongEngine.ballX0);
		this.pongCanvas.ballY = this.#toCanvasY(PongEngine.ballY0);
		//
		this.pongCanvas.initalize();
		//
		this.pongCanvas.update();
		//
		this.boxCanvas.moveCursor(this.boxCanvas.dx, this.boxCanvas.dy);
		
		this.#initalizeController();
	}
}

// 	const c = new Controller();
// 	c.onKeys([Controller.keyEnter], [printLol], console.log);
// 	c.stop = encore;
// }


const r = new CmdPong();
r.parser.eval();
