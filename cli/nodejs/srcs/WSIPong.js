class WSIPong {
	static width = 120;
	static height = 100;
	static paddleLX = 10;
	static paddleRX = 110;
	static paddleLH = 10;
	static paddleRH = 10;
	static ballX0 = 50;
	static ballY0 = 50;

	static flipXEngine(xEngine) {
		return (WSIPong.width - xEngine);
	}

	static toXDiv(xEngine, xDivMax) {
		return (Math.floor(xEngine * xDivMax / WSIPong.width));
	}

	static toYDiv(xEngine, xDivMax) {
		return (Math.floor(xEngine * xDivMax / WSIPong.height));
	}
}

module.exports = {
	"WSIPong": WSIPong
}
