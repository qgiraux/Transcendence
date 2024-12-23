const {Canvas} = require("./Canvas")

class TextBox {
	/**@type {String} */
	text;
	/**@type {Number} */
	textCursor;
	/**@type {String[]} */
	displayedText;
	/**@type {Number} */
	displayedTextX;
	/**@type {Number} */
	displayedTextY;
	/**@type {Number} */
	xScroll;
	/**@type {Number} */
	yScroll;
	///**@type {Canvas} */
	canvas = new Canvas(0,0);

	constructor(canvas){
		this.canvas = canvas;
		this.text = "";
		this.textCursor = 0;
		this.displayedText = [""];
		this.displayedTextX = 0;
		this.displayedTextY = 0;
		this.xScroll = 0;
		this.yScroll = 0;
	}

	_addC(c){
		if (1 != c.length)
			return 1;
		const code = c.charCodeAt(0);

		if ('\n' == c)
		{
			if (this.displayedTextY < this.displayedText.length)
				this.displayedText.push("");
			++this.displayedTextY;
			this.displayedTextX = 0;
			return 0;
		}
		else if (code < " ".charCodeAt(0) || code > "~".charCodeAt(0))
			return 1;
		else
		{
			if (this.displayedTextX < this.displayedText[this.displayedTextY].length)
				this.displayedText[this.displayedTextY] = c;
			else
				this.displayedText[this.displayedTextY] += c;
			++this.displayedTextX;
		}
		return 0;
	}

	_updateDisplayedText(){
		for (;this.text.length != this.textCursor; ++this.textCursor)
			this._addC(this.text[this.textCursor]);
	}

	displayText(){
		this.canvas.clearRec();
		this._updateDisplayedText();
		for (let y = this.yScroll; y != this.canvas.dy && y != this.displayedText.length; ++y)
		{
			this.canvas.moveCursor(0,y);
			process.stdout.write(this.displayedText[y].substring(this.xScroll, this.xScroll + this.canvas.dx));
		}
	}

	scrollLeft(){
		if (0 == this.xScroll)
			return ;
		--this.xScroll;
	}

	scrollRight(){
		const x = this.xScroll + 1;
	
		if (0 > x)
			this.xScroll = 0;
		this.xScroll = x;
	}

	scrollUp(){
		if (0 == this.yScroll)
			return ;
		--this.yScroll;
	}

	scrollDown(){
		const y = this.yScroll + 1;
	
		if (0 > y)
			this.yScroll = 0;
		this.yScroll = y;
	}
}

// const c = new Canvas(5,5,1,1);
// c.clearLines();
// const t = new TextBox(c);
// t.text = "sal\tut\nles amis\n01234567890123456789\nlol\nlol\nlol\nlol\nlol"

// t.displayText();
// t.scrollRight();
// t.displayText();
// t.scrollRight();
// t.displayText();
// t.scrollRight();
// t.displayText();
// t.scrollRight();
// t.displayText();