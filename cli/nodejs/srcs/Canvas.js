class Canvas {
	/**
	 * @param {Number} dx 
	 * @param {Number} dy 
	 * @param {Number} x0 
	 * @param {Number} y0 
	 * @returns {Canvas} Canvas
	 */
	constructor(dx, dy, x0=1, y0=1) {
		this.dx = dx;
		this.dy = dy;
		this.x0 = x0;
		this.y0 = y0;
		this.x = 0;
		this.y = 0;
		this.initalizeXY();
	}

	initalizeXY() {
		this.x1 = this.x0 + this.dx;
		this.y1 = this.y0 + this.dy;
		this.cursorX = this.x0;
		this.cursorY = this.y0;
	}

	initalizeXYfromCanvas(canvas, dx, dy){
		this.dx = dx;
		this.dy = dy;
		this.x0 = canvas.cursorX;
		this.y0 = canvas.cursorY;
		this.initalizeXY();
	}

	/**
	 * @param {Number} dx 
	 * @param {Number} dy 
	 * @returns {Canvas} sub canvas
	 */
	subCanvas(dx, dy){
		return new Canvas(
			dx, 
			dy, 
			this.cursorX, 
			this.cursorY
		)
	}

	/**
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	static moveCursor(x, y){
		process.stdout.write(`\x1b[${y};${x}H`)
	}

	/**
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	moveCursor(x, y){
		this.x = x;
		this.y = y;
		this.cursorX = this.x0 + this.x;
		this.cursorY = this.y0 + this.y;
		Canvas.moveCursor(this.cursorX, this.cursorY)
	}

	clearRec(){
		for (this.cursorY = this.y0; this.y1 != this.cursorY; ++this.cursorY)
		{
			Canvas.moveCursor(this.x0, this.cursorY);
			for (this.cursorX = this.x0; this.x1 != this.cursorX; ++this.cursorX)
				process.stdout.write(` `)
		}
	}

	clearLines(){
		this.moveCursor(0, 0);
		for (this.cursorY = this.y0; this.y1 != this.cursorY; ++this.cursorY)
		{
			Canvas.moveCursor(this.cursorX, this.cursorY);
			process.stdout.write(`\x1b[2K`);
		}
	}

	drawBox(){
		const ascii_box = [["▗", "▄", "▖"],["▐", " ", "▌"],["▝", "▀", "▘"]]
		let index_x = 0;
		let index_y = 0;

		this.moveCursor(0, 0)
		while ((index_x != 2 || index_y != 2) 
			&& this.cursorY < this.y1 
			&& this.cursorX < this.x1
		)
		{
			if (this.x0 == this.cursorX)
				index_x = 0;
			else if (this.x1 - 1 == this.cursorX)
				index_x = 2;
			else
				index_x = 1;
			if (this.y0 == this.cursorY)
				index_y = 0;
			else if (this.y1 - 1 == this.cursorY)
				index_y = 2;
			else
			{
				index_y = 1;
				if (1 == index_x)
				{
					this.moveCursor(this.dx - 1, this.y);
					index_x = 2;
				}
			}
			process.stdout.write(ascii_box[index_y][index_x])
			if (2 == index_x)
				this.moveCursor(0, ++this.y);
			else
				++this.cursorX;
		}
	}

	/**
	 * @param {String} text 
	 */
	drawPlainText(text){
		this.moveCursor(0, 0);
		for (const c of text)
		{
			if (this.x1 == this.cursorX)
				this.moveCursor(0, ++this.y);
			process.stdout.write(c);
			++this.cursorX;
		}
	}
}

module.exports = {
	"Canvas": Canvas
}

// c = new Canvas(5,5,1,1);
// process.stdout.write("             \n             \n             \n             \n             \n             \n");
// c.moveCursor(2,2);
// process.stdout.write("Lol");
// c.drawBox();
// c.clearLines();
// c.drawPlainText("hh ");
// //c.drawBox();
// c.moveCursor(2,2);

// sub = c.subCanvas(2,2)
// //sub.drawBox();
// sub.moveCursor(0,0);
// process.stdout.write("OK");
// c.moveCursor(10,10);