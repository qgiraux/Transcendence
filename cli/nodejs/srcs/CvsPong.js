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

	#drawPaddle(height, atTop, paddle) {
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

	#moveCursorPix(x, y) {
		this.moveCursor(Math.floor(x / CvsPong.pixPerChar),
			Math.floor(y / CvsPong.pixPerChar));
	}

	drawPaddleL(paddleCells=CvsPong.paddleLCells){
		this.#moveCursorPix(this.paddleLX, this.paddleLY);
		this.#drawPaddle(
			this.paddleLH,
			0 == this.paddleLY % 2,
			paddleCells
		);
	}

	drawPaddleR(paddleCells=CvsPong.paddleRCells){
		this.#moveCursorPix(this.paddleRX, this.paddleRY);
		this.#drawPaddle(
			this.paddleRH,
			0 == this.paddleRY % 2,
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
		this.paddleRX = CvsPong.pixPerChar * (this.dx - 1);
		this.netX = Math.floor(this.dx / 2);
		this.scoreLY = 2;
		this.scoreRY = 2;
		let x = Math.floor(this.dx / 4);

		this.scoreLX = x;
		this.scoreRX = 3 * x;
	}

	drawBall(){
		this.#moveCursorPix(this.ballX, this.ballY);
		const index = (this.ballX % 2) + 2 * (this.ballY % 2);

		if (0 > index || 3 < index)
			return ;
		process.stdout.write(CvsPong.ballCells[index]);
	}

	eraseBall(){
		this.#moveCursorPix(this.ballX, this.ballY);
		process.stdout.write(" ");
	}

	update(callback = () => {}){
		this.drawPaddleL(CvsPong.paddleEraseCells);
		this.drawPaddleR(CvsPong.paddleEraseCells);
		this.eraseBall();
		callback();
		this.drawPaddleL();
		this.drawPaddleR();
		this.drawNet();
		this.drawScoreL();
		this.drawScoreR();
		this.drawBall();
	}

	// static fromCanvas(canvas, dx, dy){
	// 	return new CvsPong(
	// 		dx, 
	// 		dy, 
	// 		canvas.cursorX, 
	// 		canvas.cursorY
	// 	)
	// }
}

// void		Game::printNet(void)
// {
// 	cli_move_cursor_to(this->_net_x, 1);
// 	for (t_cpos y = 0; y != this->_screen_ymax; ++y)
// 		std::cout << CLI_NETCELL << CLI_ANSI_CURSOR_1BACK1DOWN;
// }

module.exports = {
	"CvsPong": CvsPong
}

// o = new Canvas(53,22,1,1);
// o.drawBox();
// o.moveCursor(1, 1);

// c = CvsPong.fromCanvas(o, 51, 20);

// c.paddleRY = 1;
// c.paddleLY = 5;

// c.paddleRH = 10;
// c.paddleLH = c.paddleRH;
// c.scoreL = 5;
// c.scoreR = 42;
// c.ballX = 20;
// c.ballY = 13;

// c.initalize();

// c.drawPaddleL();
// c.drawPaddleR();
// c.drawNet();
// c.drawScoreL();
// c.drawScoreR();
// //c.drawPaddleL(CvsPong.paddleEraseCells);
// //c.drawPaddleR(CvsPong.paddleEraseCells);
// c.drawBall();
// //c.eraseBall();

// o.moveCursor(o.dx, o.dy);
