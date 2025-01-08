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

class CmdPong extends JWTCmd {
	constructor() {
		super((jwt)=>{this.onLogin(jwt)}, () => {return this.checkCanvas()}, "node pong-cli pong");
		this.width = 53; //Min 29
		this.height = 33; // Min 8
		this.boxCanvas = undefined;
		this.pongCanvas = undefined;
		this.description = "Play Pong."; //
		this.parser.addOptions([
			"[--width=<width>]", 
			"[--height=<height>]"
		],[
			(match) => {this.width = Number(Parser.getOptionValue(match))}, 
			(match) => {this.height = Number(Parser.getOptionValue(match))}
		]);
		this.controller = new Controller();
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
		this.controller.onStopKey = () => {CvsPong.showCursor()}; //Move at End
		this.controller.onKeys([
			Controller.keyEnter, 
			Controller.keyArrowUp, 
			Controller.keyArrowDown
		], [
			() => {this.pongCanvas.update(()=>{this.pongCanvas.scoreL += 1})}, //
			() => {this.pongCanvas.update(()=>{this.pongCanvas.paddleLY -= 1})}, //
			() => {this.pongCanvas.update(()=>{this.pongCanvas.paddleLY += 1})} //
		]);
	}

	onLogin(jwt) {
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
		this.pongCanvas.paddleRY = 1;
		this.pongCanvas.paddleLY = 5;
		this.pongCanvas.paddleRH = 10;
		this.pongCanvas.paddleLH = this.pongCanvas.paddleRH;
		this.pongCanvas.scoreL = 5;
		this.pongCanvas.scoreR = 42;
		this.pongCanvas.ballX = 20;
		this.pongCanvas.ballY = 13;
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
