import Application from "./Application.js";

class PongRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
  }

  drawPaddle1(paddle) {
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 4;
    this.ctx.shadowOffsetY = 4;
    let gradient = this.ctx.createLinearGradient(
      paddle.x,
      paddle.y,
      paddle.x,
      paddle.y + paddle.height
    );
    gradient.addColorStop(0, "lightgrey");
    gradient.addColorStop(0.5, "lightpink");
    gradient.addColorStop(1, "lightgrey");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      paddle.x + paddle.width / 2,
      paddle.y - paddle.height / 2,
      paddle.width,
      paddle.height
    );
    this.ctx.shadowColor = "transparent";
  }

  drawPaddle2(paddle) {
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 4;
    this.ctx.shadowOffsetY = 4;
    let gradient = this.ctx.createLinearGradient(
      paddle.x - paddle.width,
      paddle.y,
      paddle.x,
      paddle.y + paddle.height
    );
    gradient.addColorStop(0, "lightgrey");
    gradient.addColorStop(0.5, "lightpink");
    gradient.addColorStop(1, "lightgrey");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      paddle.x - paddle.width / 2,
      paddle.y - paddle.height / 2,
      paddle.width,
      paddle.height
    );
    this.ctx.shadowColor = "transparent";
  }

  drawScore(score1, score2) {
    this.ctx.fillRect(this.canvas.width / 4 - 15, 28, 30, 30);
    this.ctx.fillRect((this.canvas.width / 4) * 3 - 15, 28, 30, 30);
    this.ctx.fillStyle = "black";
    this.ctx.fillText(
      score1,
      this.canvas.width / 4 - this.ctx.measureText(score1).width / 2,
      50
    );
    this.ctx.fillText(
      score2,
      (this.canvas.width / 4) * 3 - this.ctx.measureText(score1).width / 2,
      50
    );
    this.ctx.fillStyle = "white";
  }

  drawBall(ball) {
    let gradient = this.ctx.createRadialGradient(
      ball.x,
      ball.y,
      ball.radius / 4,
      ball.x,
      ball.y,
      ball.radius
    );
    gradient.addColorStop(0, "lightpink");
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
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `PLAYER ${winner} WON!!`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    this.ctx.fillText(
      "press space for new game",
      this.canvas.width / 2,
      this.canvas.height / 2 + 30
    );
  }


  drawPauseMessage(winner) {
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `PLAYER ${winner} SCORED!!`,
      (this.canvas.width * 1) / 2,
      this.canvas.height / 2
    );
    this.ctx.fillText(
      "press space for next game",
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
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "white";
    // this.ctx.fillText(
    //   Application.joinedTournament,
    //   this.canvas.width /2,
    //   this.canvas.height -50
    // );
    this.ctx.fillText(
      "press space to start",
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
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(count, this.canvas.width / 2, this.canvas.height / 2);
  }

  drawNames(player1, player2) {
    this.ctx.fillStyle = "blue";
    this.ctx.font = "18px Arial";
    // this.ctx.fillRect((this.canvas.width / 4) - 7, 25, 30, 30);
    // this.ctx.fillRect((this.canvas.width / 4) * 3 - 7, 25, 30, 30);
    let p1 = player1 || "Player 1";
    let p2 = player2 || "Player 2";
    this.ctx.fillStyle = "white";
    this.ctx.font.width;
    this.ctx.fillText(
      p1,
      this.canvas.width / 4 - this.ctx.measureText(p1).width / 2,
      20
    );
    this.ctx.fillText(
      p2,
      (this.canvas.width / 4) * 3 - this.ctx.measureText(p2).width / 2,
      20
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
