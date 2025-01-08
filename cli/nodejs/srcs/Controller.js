const process = require('node:process');
const assert = require('node:assert');

class Controller {

	static keyCtrlD = '\u0003';
	static keyCtrlC = '\u0004';
	static keyArrowUp = '\x1B[A';
	static keyArrowDown = '\x1B[B';
	static keyArrowRight = '\x1B[C';
	static keyArrowLeft = '\x1B[D';
	static keyEnter = '\x0D';
	static keyBackspace = '\x7F';

	constructor(isStopKey=Controller._isStopKey) {
		this.isStopKey = isStopKey;
		this.stop = () => {}; //make private
		this.initalized = false;
		this.onStopKey = () => {};
	}

	static getCharCode(buff){
		const key = String(buff);

		if (1 != key.length)
			return 0;
		return key.charCodeAt(0);
	}

	static isPrintable(charCode)
	{
		return (charCode >= " ".charCodeAt(0) 
			&& charCode <= "~".charCodeAt(0)
		);
	}

	static _isStopKey(key){
		return (Controller.keyCtrlD == key || Controller.keyCtrlC == key)
	}

	static stop(){
		process.stdin.setRawMode(false);
		process.stdin.pause();
	}

	_keys_callback(buf, keys=[], callbacks=[], callback, elseCallback){
		if (this.isStopKey(buf)) {
			this.onStopKey(); //
			process.stdin.removeListener('data', callback);
			this.stop();
		}
		const index = keys.indexOf(String(buf).toUpperCase());

		if (-1 != index)
			callbacks[index]();
		else
			elseCallback(buf);
	}

	initalize(stdin, event_callback){
		assert.equal(false, this.initalized);
		stdin.setRawMode(true);
		stdin.resume();
		//console.log(process.stdin.rawListeners('data')); //
		stdin.on('data', event_callback);
		this.stop = () => {
			stdin.removeListener('data', event_callback);
			Controller.stop();
		};
		this.initalized = true;
	}

	onAnyKey(callback){
		const stdin = process.stdin;
		const event_callback = (buf) => {
			callback(buf);
			if (this.isStopKey(buf)) {
				this.onStopKey(); //
				stdin.removeListener('data', event_callback);
				this.stop();
			}
		}

		this.initalize(stdin, event_callback);
	}

	/**
	 * @param {String[]} keys list of key (Use uppercase)
	 * @param {Function[]} callbacks functions ()=>()
	 */
	onKeys(keys=[], callbacks=[], elseCallback=(buff)=>{}){
		assert.equal(keys.length, callbacks.length);
		const stdin = process.stdin;
		const event_callback = (buf) => {
			this._keys_callback(
				buf, keys, callbacks, event_callback, elseCallback
			);
		}

		this.initalize(stdin, event_callback);
	}
}

module.exports = {
	"Controller": Controller
}

// /**
//  * Testing purposes
//  */
// function main(){
// 	function printLol(){
// 		console.log("LOL");
// 	}

// 	function printPatate(){
// 		console.log("Patate");
// 	}

// 	const encore = () =>{
// 		Controller.stop();
// 		const cc = new Controller();
// 		//cc.onAnyKey(console.log);
// 		cc.onKeys([Controller.keyEnter], [printPatate], console.log);
// 		cc.stop = Controller.stop;
// 	}

// 	const c = new Controller();
// 	c.onKeys([Controller.keyEnter], [printLol], console.log);
// 	c.stop = encore;
// }

// main();
