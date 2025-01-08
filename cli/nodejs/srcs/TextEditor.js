const {Controller} = require("./Controller")

class TextEditor extends Controller {

	static buffPop = `${Controller.keyArrowLeft} ${Controller.keyArrowLeft}`;

	constructor(){
		super();
		this.text = "";
	}

	setOnKeys(callback=(text_)=>{}, echo=(buffout_)=>{}, keyEnter=Controller.keyEnter){
		this.onKeys(
			[Controller.keyBackspace, keyEnter], 
			[() => {this._onBackSpaceCallback();}, () => {this.stop(); callback(this.text);}],
			(buff) => {this._onKeyCallback(buff, (buff_)=>{echo(buff_)});}
		);
	}

	_onBackSpaceCallback(){
		if (0 == this.text.length)
			return ;
		this.text = this.text.slice(0, -1);
		process.stdout.write(TextEditor.buffPop);
	}

	_onKeyCallback(buff, echo){
		const code = Controller.getCharCode(buff);

		if (Controller.isPrintable(code))
		{
			this.text += String(buff);
			echo(buff);
		}
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
