const process = require('node:process');
const assert = require('node:assert');

class Controller {

	static keyCtrlD = '\u0003';
	static keyCtrlC = '\u0004';
	static keyKill = '\u001f';
	static keyArrowUp = '\x1B[A';
	static keyArrowDown = '\x1B[B';
	static keyArrowRight = '\x1B[C';
	static keyArrowLeft = '\x1B[D';
	static keyEnter = '\x0D';
	static keyEnterNotTTY = '\x0A';
	static keyBackspace = '\x7F';

	constructor(isStopKey=Controller._isStopKey) {
		this.isStopKey = isStopKey;
		this.stop = () => {};
		this.initalized = false;
		this.onStopKey = () => {};
	}

	static isPrintableChar(s){
		if (1 == s.length)
			return (!!/[^\p{Zl}\p{Zp}\p{C}\p{M}]/u.exec(s));
		else if (2 == s.length)
			return (!!/\p{Cs}/u.exec(s[0]) && !!/\p{Cs}/u.exec(s[1])); //utf-16
		return false;
	}

	//remove
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
		return (Controller.keyCtrlD == key || Controller.keyCtrlC == key);
	}

	static stop(){
		if (process.stdin.isTTY) {
			process.stdin.setRawMode(false); //TODO: maybe print a warning
		}
		process.stdin.pause();
	}

	#parseBuffer(buf, keys=[], callbacks=[], callback, elseCallback){
		if (Controller.keyKill == buf)
			process.exit();
		if (this.isStopKey(buf)) {
			this.onStopKey();
			process.stdin.removeListener('data', callback);
			this.stop();
		}
		const s = String(buf);
		let start = 0;

		while (start < s.length) {
			let end = start + 1;
			if ('\x1B' == s[start])
				end += ('[' == s[end]) ? 2 : 1;
			else if (/^\p{Cs}/u.exec(s[start]))
				end += 1;
			const key = s.substring(start, end);
			const index = keys.indexOf(key.toUpperCase());

			if (-1 != index)
				callbacks[index]();
			else
				elseCallback(Buffer.from(key));
			start = end;
		}
	}

	initalize(stdin, eventCallback){
		assert.equal(false, this.initalized);
		if (stdin.isTTY) {
			stdin.setRawMode(true);
		}
		stdin.resume();
		stdin.on('data', eventCallback);
		this.stop = () => {
			stdin.removeListener('data', eventCallback);
			Controller.stop();
		};
		this.initalized = true;
	}

	onAnyKey(callback){
		const stdin = process.stdin;
		const eventCallback = (buf) => {
			callback(buf);
			if (this.isStopKey(buf)) {
				this.onStopKey();
				stdin.removeListener('data', eventCallback);
				this.stop();
			}
		}

		this.initalize(stdin, eventCallback);
	}

	/**
	 * @param {String[]} keys list of key (Use uppercase)
	 * @param {Function[]} callbacks functions ()=>()
	 */
	onKeys(keys=[], callbacks=[], elseCallback=(buff)=>{}){
		assert.equal(keys.length, callbacks.length);
		const stdin = process.stdin;
		const eventCallback = (buf) => {
			this.#parseBuffer(
				buf, keys, callbacks, eventCallback, elseCallback
			);
		}

		this.initalize(stdin, eventCallback);
	}
}

module.exports = {
	"Controller": Controller
}
