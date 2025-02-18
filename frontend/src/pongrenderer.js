import Application from "./Application.js";

class PongRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
  }

  drawPaddle1(paddle) {
    this.ctx.shadowColor = "white";
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(
      paddle.x + paddle.width / 2,
      paddle.y - paddle.height / 2,
      paddle.width,
      paddle.height
    );
    
    this.ctx.shadowColor = "transparent";
  }

  drawPaddle2(paddle) {
    this.ctx.shadowColor = "white";
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(
      paddle.x - paddle.width / 2,
      paddle.y - paddle.height / 2,
      paddle.width,
      paddle.height
    );
    this.ctx.shadowColor = "transparent";
  }

  drawScore(score1, score2) {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.canvas.width / 4 - 25, 35, 50, 50);
    this.ctx.fillRect((this.canvas.width / 4) * 3 - 25, 35, 50, 50);
    this.ctx.textAlign = "center";
    this.ctx.font = "40px Audiowide";
    this.ctx.fillStyle = "#ff4632";
    this.ctx.fillText(
      score1,
      this.canvas.width / 4,
      75
    );
    this.ctx.fillText(
      score2,
      (this.canvas.width / 4) * 3,
      75
    );
    this.ctx.fillStyle = "white";
  }

  drawBall(ball) {
    this.ctx.fillStyle = "white";
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.closePath();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGameOverMessage(winner) {
    this.ctx.textAlign = "center";
    this.ctx.font = "20px Audiowide"
    this.ctx.fillText(
      `PLAYER ${winner} WON!!`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    this.ctx.fillText(
      "Press SPACE for a new game",
      this.canvas.width / 2,
      this.canvas.height / 2 + 30
    );
  }


  drawPauseMessage(winner) {
    this.ctx.font = "20px Audiowide"
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `PLAYER ${winner} SCORED!!`,
      (this.canvas.width * 1) / 2,
      this.canvas.height / 2
    );
    this.ctx.fillText(
      "Press SPACE to resume",
      (this.canvas.width * 1) / 2,
      this.canvas.height / 2 + 30
    );
  }

  drawStartMessage(paddle1, paddle2, player1, player2) {
    console.log("drawStartMessage", player1, player2);
    this.clearCanvas();
    this.drawScore(0, 0);
    this.drawPaddle1(paddle1);
    this.drawPaddle2(paddle2);
    this.ctx.font = "20px Montserrat";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(
      "Press SPACE to start",
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    this.drawNames(player1, player2);
  }

  drawCountdownMessage(
    paddle1,
    paddle2,
    score1,
    score2,
    count,
    player1,
    player2
  ) {
    this.clearCanvas();
    this.drawNames(player1, player2);
    this.drawScore(score1, score2);
    this.drawPaddle1(paddle1);
    this.drawPaddle2(paddle2);
    this.ctx.font = "40px Audiowide";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(count, this.canvas.width / 2, this.canvas.height / 2);
  }

  drawNames(player1, player2) {
    this.ctx.fillStyle = "white";
    this.ctx.font = "18px Montserrat";
    this.ctx.textAlign = "center";
    let p1 = player1 || "Player 1";
    let p2 = player2 || "Player 2";
    this.ctx.fillText(
      p1,
      this.canvas.width / 4,
      25
    );
    this.ctx.fillText(
      p2,
      (this.canvas.width / 4) * 3,
      25
    );
  }
  renderingLoop(paddle1, paddle2, score1, score2, ball, player1, player2) {
    this.clearCanvas();
    this.drawNames(player1, player2);
    this.drawScore(score1, score2);
    this.drawPaddle1(paddle1);
    this.drawPaddle2(paddle2);
    this.drawBall(ball);
  }
}

export default PongRenderer;
