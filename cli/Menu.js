const {Canvas} = require("./Canvas")
const {Controller} = require("./Controller")


// let g_selectedItem = 0;

class Menu {

	canvas = new Canvas(0,0);
	controller = new Controller();
	choices = [];

	/**
	 * @param {String[]} choices
	 * @param {Canvas} canvas
	 */
	constructor(choices, canvas) {
		this.choices = choices;
		this.canvas = canvas;
		this.canvas.clearRec();
		this.selectedItem = 0;
	}

	waitChoice(callback) {
		this._drawChoices();
		this.controller.isStopKey = (key) => {
			return Controller.keyEnter == key;
		}
		this.controller.stop = () => {
			Controller.stop();
			this.canvas.clearRec();
			callback(this.selectedItem);
		};
		this.controller.onKeys(
			[Controller.keyArrowUp, Controller.keyArrowDown], 
			[() => {this._choiceUp()}, () => {this._choiceDown()}]
		);
	}

	help(){
		return "[↓][↑] Select Choice [↵] Confirm Selection";
	}

	_choiceUp(){
		const selectedItem = this.selectedItem;

		if (0 == selectedItem)
			this.selectedItem = this.choices.length - 1;
		else
			this.selectedItem = ((selectedItem - 1) % this.choices.length);
		this._drawChoice(selectedItem);
		this._drawChoice(this.selectedItem);
	}

	_choiceDown(){
		const selectedItem = this.selectedItem;

		this.selectedItem = ((selectedItem + 1) % this.choices.length);
		this._drawChoice(selectedItem);
		this._drawChoice(this.selectedItem);
	}

	_drawChoices(){
		for (let i = 0; i != this.choices.length; ++i)
			this._drawChoice(i);
	}

	_drawChoice(i){
		this.canvas.moveCursor(0,i);
		if (i == this.selectedItem)
			process.stdout.write(`\x1b[7m`)
		process.stdout.write(this.choices[i]);
		process.stdout.write(`\x1b[0m`)
	}
}

//console.log(Canvas)

const c = new Canvas(50, 50);
c.clearRec();

const m = new Menu(["LOLfsfsddsfsdf", "OK"], c);
m.waitChoice(console.log);

// m._drawChoices();

// m.controller.onKeys(
// 	[Controller.keyArrowUp, Controller.keyArrowDown], 
// 	[() => {m._choiceUp()}, () => {m._choiceDown()}]
// );

//m._drawChoices();
// function printLol(){
// 	console.log("LOL");
// }

// console.log(Controller)

// c = new Controller();
// c.onAnyKey(console.log);
// c.onKeys([Controller.keyArrowUp], [printLol]);
// c.onKeys([Controller.keyArrowDown], [printLol]);
