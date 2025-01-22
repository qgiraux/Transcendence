class PongRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
    }

    drawPaddle(paddle) {
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;
        let gradient = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
        gradient.addColorStop(0, "lightgrey");
        gradient.addColorStop(0.5, "lightblue");
        gradient.addColorStop(1, "lightgrey");
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        this.ctx.shadowColor = "transparent";
    }

    drawScore(score1, score2) {
        this.ctx.fillRect((this.canvas.width / 4) - 7, 25, 30, 30);
        this.ctx.fillRect((this.canvas.width / 4) * 3 - 7, 25, 30, 30);
        this.ctx.fillStyle = "black";
        this.ctx.fillText(score1, (this.canvas.width / 4), 50);
        this.ctx.fillText(score2, (this.canvas.width / 4) * 3, 50);
        this.ctx.fillStyle = "white";
    }

    drawBall(ball) {
        let gradient = this.ctx.createRadialGradient(ball.x, ball.y, ball.radius / 4, ball.x, ball.y, ball.radius);
        gradient.addColorStop(0, "lightblue");
        gradient.addColorStop(1, "lightgrey");
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.shadowColor = "transparent";
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGameOverMessage(winner) {
        this.ctx.fillText(`PLAYER ${winner} WON!!`, (this.canvas.width * 1 / 3), (this.canvas.height / 2));
        this.ctx.fillText("press space for new game", (this.canvas.width * 1 / 3) - 33, (this.canvas.height / 2) + 30);
    }

    drawPauseMessage(winner) {
        this.ctx.fillText(`PLAYER ${winner} SCORED!!`, (this.canvas.width * 1 / 3), (this.canvas.height / 2));
        this.ctx.fillText("press space for next game", (this.canvas.width * 1 / 3) - 33, (this.canvas.height / 2) + 30);
    }

    renderingLoop(paddle1, paddle2, score1, score2, ball) {
        this.clearCanvas();
        this.drawScore(score1, score2);
        this.drawPaddle(paddle1);
        this.drawPaddle(paddle2);
        this.drawBall(ball);
    }
}

export default PongRenderer;