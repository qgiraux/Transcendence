const {Canvas} = require("./Canvas");

class CvsPong extends Canvas {
	static pixPerChar = 2;
	static ansiBackDown = "\x1b[1B\x1b[1D";
	static netCell = "।";
	static paddleEraseCells = "   ";
	static paddleLCells = "▝▐▗";
	static paddleRCells = "▘▌▖";
	static ansiDigitNextRow = "\x1b[1B\x1b[3D";
	static ansiDigitNext = "\x1b[3A\x1b[8D";
	static ballCells = "▘▝▖▗";
	static ballEraseCells = "    ";

	/** */
	constructor(dx, dy, x0, y0) {
		super(dx, dy, x0, y0);
		this.clearRec();
		/**@type {Number} pixel*/
		this.ballX = 0;
		/**@type {Number} pixel*/
		this.ballY = 0;
		/**@type {Number} pixel*/
		this.paddleLY = 0;
		/**@type {Number} pixel*/
		this.paddleLX = 0;
		/**@type {Number} pixel*/
		this.paddleLH = 0;
		/**@type {Number} pixel*/
		this.paddleRY = 0;
		/**@type {Number} pixel*/
		this.paddleRX = 0;
		/**@type {Number} pixel*/
		this.paddleRH = 0;
		/**@type {Number} cell*/
		this.netX = 0;
		/**@type {Number} cell*/
		this.scoreLX = 0;
		/**@type {Number} cell*/
		this.scoreLY = 0;
		/**@type {Number} cell*/
		this.scoreRX = 0;
		/**@type {Number} cell*/
		this.scoreRY = 0;
		/**@type {Number} score*/
		this.scoreL = 0;
		/**@type {Number} score*/
		this.scoreR = 0;
		/**@type {Number} */
		this.gameState = 0;
	}

	static hideCursor(){
		process.stdout.write("\x1b[?25l");
	}

	static showCursor(){
		process.stdout.write("\x1b[?25h");
	}

	static #drawPaddleChar(c){
		process.stdout.write(`${c}${CvsPong.ansiBackDown}`);
	}

	#drawPaddle(height, paddleX, paddleY, paddle) {
		const atTop = (0 == paddleY % 2);

		this.#moveCursorPix(paddleX, paddleY);
		if (!atTop) {
			CvsPong.#drawPaddleChar(paddle[2]);
			height -= 1;
		}
		while (CvsPong.pixPerChar <= height)
		{
			CvsPong.#drawPaddleChar(paddle[1]);
			height -= CvsPong.pixPerChar;
		}
		if (1 == height)
			CvsPong.#drawPaddleChar(paddle[0]);
	}

	#drawPaddleInCanvas(height, paddleX, paddleY, paddle) {
		if (0 >= height 
			|| -height == paddleY 
			|| paddleY > CvsPong.pixPerChar * this.dy
		) {
			return ;
		} else if (0 > paddleY) {
			height += paddleY;
			paddleY = 0;
		}
		const diffMax = paddleY + height - CvsPong.pixPerChar * this.dy;

		if (0 < diffMax)
			height -=  diffMax;
		this.#drawPaddle(height, paddleX, paddleY, paddle);
	}

	#moveCursorPix(x, y) {
		this.moveCursor(Math.floor(x / CvsPong.pixPerChar),
			Math.floor(y / CvsPong.pixPerChar));
	}

	drawPaddleL(paddleCells=CvsPong.paddleLCells){
		this.#drawPaddleInCanvas(
			this.paddleLH,
			this.paddleLX,
			this.paddleLY,
			paddleCells
		);
	}

	drawPaddleR(paddleCells=CvsPong.paddleRCells){
		this.#drawPaddleInCanvas(
			this.paddleRH,
			this.paddleRX,
			this.paddleRY,
			paddleCells
		);
	}

	drawNet(){
		this.moveCursor(this.netX, 0);
		for(let y = 0; y != this.dy; ++y)
			process.stdout.write(`${CvsPong.netCell}${CvsPong.ansiBackDown}`);
	}

	static #printDigit(rows){
		process.stdout.write(
			rows[0] + CvsPong.ansiDigitNextRow
			+ rows[1] + CvsPong.ansiDigitNextRow
			+ rows[2] + CvsPong.ansiDigitNextRow
			+ rows[3]
		);
	}

	static #printClear(){
		CvsPong.#printDigit([
			"   ",
			"   ",
			"   ",
			"   "
		]);
	}

	static #print0(){
		CvsPong.#printDigit([
			"▛▀▜",
			"▌ ▐",
			"▌ ▐",
			"▙▄▟"
		]);
	}

	static #print1(){
		CvsPong.#printDigit([
			"  ▐",
			"  ▐",
			"  ▐",
			"  ▐"
		]);
	}

	static #print2(){
		CvsPong.#printDigit([
			"▀▀▜",
			"▄▄▟",
			"▌  ",
			"▙▄▄"
		]);
	}

	static #print3(){
		CvsPong.#printDigit([
			"▀▀▜",
			"▄▄▟",
			"  ▐",
			"▄▄▟"
		]);
	}

	static #print4(){
		CvsPong.#printDigit([
			"▌ ▐",
			"▙▄▟",
			"  ▐",
			"  ▐"
		]);
	}

	static #print5(){
		CvsPong.#printDigit([
			"▛▀▀",
			"▙▄▄",
			"  ▐",
			"▄▄▟"
		]);
	}

	static #print6(){
		CvsPong.#printDigit([
			"▛▀▀",
			"▙▄▄",
			"▌ ▐",
			"▙▄▟"
		]);
	}

	static #print7(){
		CvsPong.#printDigit([
			"▀▀▜",
			"  ▐",
			"  ▐",
			"  ▐"
		]);
	}
	
	static #print8(){
		CvsPong.#printDigit([
			"▛▀▜",
			"▙▄▟",
			"▌ ▐",
			"▙▄▟"
		]);
	}

	static #print9(){
		CvsPong.#printDigit([
			"▛▀▜",
			"▙▄▟",
			"  ▐",
			"▄▄▟"
		]);
	}

	static #printNum(num) {
		const index = 1 + "0123456789".indexOf(num);
		const printFun = [
			CvsPong.#printClear, 
			CvsPong.#print0, 
			CvsPong.#print1,
			CvsPong.#print2,
			CvsPong.#print3,
			CvsPong.#print4,
			CvsPong.#print5,
			CvsPong.#print6,
			CvsPong.#print7,
			CvsPong.#print8,
			CvsPong.#print9
		];

		printFun[index]();
	}

	static #printScoreRec(num, base, maxDigit){
		if (0 == maxDigit)
			return ;
		if (base > num)
			CvsPong.#printNum(num);
		else
		{
			CvsPong.#printNum(num % base);
			process.stdout.write(CvsPong.ansiDigitNext);
			CvsPong.#printScoreRec(Math.floor(num / base), base, maxDigit - 1);
		}
	}

	drawScoreL(){
		this.moveCursor(this.scoreLX, this.scoreLY);
		CvsPong.#printScoreRec(this.scoreL, 10, 2);
	}

	drawScoreR(){
		this.moveCursor(this.scoreRX, this.scoreRY);
		CvsPong.#printScoreRec(this.scoreR, 10, 2);
	}

	initalize(){
		this.netX = Math.floor(this.dx / 2);
		this.scoreLY = 2;
		this.scoreRY = 2;
		let x = Math.floor(this.dx / 4);

		this.scoreLX = x;
		this.scoreRX = 3 * x;
	}

	drawBall(ballCells = CvsPong.ballCells){
		if (0 > this.ballX || 0 > this.ballY
			|| CvsPong.pixPerChar * this.dx <= this.ballX
			|| CvsPong.pixPerChar * this.dy <= this.ballY
		)
			return ;
		this.#moveCursorPix(this.ballX, this.ballY);
		if (CvsPong.ballEraseCells == ballCells) {
			process.stdout.write(" ");
		} else {
			const index = (this.ballX % 2) + 2 * (this.ballY % 2);

			if (0 > index || 3 < index)
				return ;
			process.stdout.write(ballCells[index]);
		}
	}

	update(callback = () => {}){
		this.drawPaddleL(CvsPong.paddleEraseCells);
		this.drawPaddleR(CvsPong.paddleEraseCells);
		this.drawBall(CvsPong.ballEraseCells);
		callback();
		this.drawPaddleL();
		this.drawPaddleR();
		this.drawNet();
		this.drawScoreL();
		this.drawScoreR();
		this.drawBall();
	}
}

module.exports = {
	"CvsPong": CvsPong
}
