class WSIPong {
	static width = 200;
	static height = 100;
	static paddleLX = 10;
	static paddleRX = 190;
	static paddleLH = 20;
	static paddleRH = 20;
	static ballX0 = 100;
	static ballY0 = 50;

	static flipXEngine(xEngine) {
		return (WSIPong.width - xEngine);
	}

	static toXDiv(xEngine, xDivMax) {
		return (Math.floor(xEngine * xDivMax / WSIPong.width));
	}

	static toYDiv(yEngine, yDivMax) {
		return (Math.floor(yEngine * yDivMax / WSIPong.height));
	}

	static ready = JSON.stringify({type: "ready"});

	/**
	 * @param {"up" | "down"} d 
	 * @returns {String}
	 */
	static movePaddle(d) {
		return JSON.stringify({
			type: "move_paddle",
			data: {direction: d}
		});
	}
}

module.exports = {
	"WSIPong": WSIPong
}

// #sayReady() {
// 	this.ws.send(JSON.stringify({
// 		type: "ready",
// 		data: {direction: "ready"}
// 	}));
// }

// #movePaddle(d) {
// 	this.ws.send(JSON.stringify({
// 		type: "move_paddle",
// 		data: {direction: d}
// 	}));
// }
