const {Controller} = require("./Controller")

class TextEditor extends Controller {

	static buffPop = `${Controller.keyArrowLeft} ${Controller.keyArrowLeft}`;

	constructor(){
		super();
		this.text = "";
		this.echo = TextEditor.echo;
		this.onEnter = () => {this.stop()};
		this.onAltEnter = () => {};
		this.refresh = () => {this.#refresh()};
	}

	setOnKeys(keyEnter){
		if (!keyEnter) {
			if (process.stdin.isTTY) {
				keyEnter = Controller.keyEnter;
			} else {
				keyEnter = Controller.keyEnterNotTTY;
			}
		}
		this.onKeys(
			[Controller.keyBackspace, keyEnter, `\x1b${keyEnter}`], [
				() => {this.#onBackSpaceCallback()}, 
				() => {this.#onEnterCallback()}, 
				() => {this.#onAltEnterCallback()}
			], (buff) => {this.#onKeyCallback(buff, (buff_)=>{this.echo(buff_)})}
		);
	}

	#refresh() {
		process.stdout.write(`\r\x1b[2K${this.text}`);
	}

	#onEnterCallback() {
		this.onEnter();
	}

	#onAltEnterCallback() {
		this.onAltEnter();
	}

	#onBackSpaceCallback(){
		if (0 == this.text.length)
			return ;
		let c = this.text.slice(-1);

		if (!!/\p{Cs}/u.exec(c)) {
			this.text = this.text.slice(0, -1);
			c = this.text.slice(-1);
			if (!!/\p{Cs}/u.exec(c))
				this.text = this.text.slice(0, -1);
		} else {
			this.text = this.text.slice(0, -1);
			while (!!/[\p{C}\p{M}]/u.exec(c) && 0 != this.text.length) {
				this.text = this.text.slice(0, -1);
				c = this.text.slice(-1);
			}
		}
		this.refresh();
	}

	#onKeyCallback(buff, echo){
		const char = String(buff);

		if (Controller.isPrintableChar(char)) {
			this.text += String(buff);
			echo(buff);
		}
		// const code = Controller.getCharCode(buff);

		// if (Controller.isPrintable(code))
		// {
		// 	this.text += String(buff);
		// 	echo(buff);
		// }
	}

	static echo(buff){
		process.stdout.write(String(buff));
	}

	static echo_hidden(buff){
		process.stdout.write("*".repeat(String(buff).length));
	}
}

module.exports = {
	"TextEditor": TextEditor
}

// function main(){
// 	const c = new TextEditor(console.log, (buffout) => TextEditor.echo(buffout), Controller.keyEnter);
// }

// main();
