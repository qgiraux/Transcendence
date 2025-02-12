import PongRenderer from "./pongrenderer.js";

class PongGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id ${canvasId} not found`);
        }
        this.renderer = new PongRenderer(this.canvas);
        this.paddle1 = { x: this.canvas.width / 80, y: this.canvas.height / 2, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
        this.paddle2 = { x: this.canvas.width - this.canvas.width / 40, y: this.canvas.height / 2, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
        this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: 10, dx: 4, dy: 4 };
        this.endScore = 3;
        this.score1 = 0;
        this.score2 = 0;
        this.commands = { up: 0, down: 0, w: 0, s: 0 };
        this.reset = false;

        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
        this.boundResumeGame = (event) => this.resumeGame(event, this.reset);

        document.addEventListener('keydown', this.boundHandleKeyDown);
        document.addEventListener('keyup', this.boundHandleKeyUp);
        document.addEventListener('keydown', this.boundResumeGame);
    }

    destroy() {
        console.log('Destroying PongGame');
        document.removeEventListener('keydown', this.boundHandleKeyDown);
        document.removeEventListener('keyup', this.boundHandleKeyUp);
        document.removeEventListener('keydown', this.boundResumeGame);
    }
    
    handleKeyDown(event) {
        console.log(event.key);
        switch (event.key) {
            case 'ArrowUp':
                this.commands.up = 1;
                break;
            case 'ArrowDown':
                this.commands.down = 1;
                break;
            case 'w':
                this.commands.w = 1;
                break;
            case 's':
                this.commands.s = 1;
                break;
        }
    }

    handleKeyUp(event) {
        switch (event.key) {
            case 'ArrowUp':
                this.commands.up = 0;
                break;
            case 'ArrowDown':
                this.commands.down = 0;
                break;
            case 'w':
                this.commands.w = 0;
                break;
            case 's':
                this.commands.s = 0;
                break;
        }
    }

    movePaddles() {
        if (this.commands.up == 1)
            this.paddle2.y = Math.max(this.paddle2.y - this.paddle2.dy, 0);
        if (this.commands.down == 1)
            this.paddle2.y = Math.min(this.paddle2.y + this.paddle2.dy, this.canvas.height - this.paddle2.height);
        if (this.commands.w == 1)
            this.paddle1.y = Math.max(this.paddle1.y - this.paddle1.dy, 0);
        if (this.commands.s == 1)
            this.paddle1.y = Math.min(this.paddle1.y + this.paddle1.dy, this.canvas.height - this.paddle1.height);
    }

    pingPong() {
        if (this.ball.y + this.ball.radius > this.canvas.height || this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
        }
        if (this.ball.x + this.ball.radius > this.canvas.width - 20 && this.ball.y + this.ball.radius > this.paddle2.y && this.ball.y + this.ball.radius < this.paddle2.y + 100 && this.ball.dx > 0) {
            this.ball.dx = -this.ball.dx;
            let deltaY = (this.ball.y - (this.paddle1.y + this.paddle2.height / 2)) / (this.paddle2.height / 2);
            this.ball.dy = deltaY * 2;
        } else if (this.ball.x + this.ball.radius < 40 && this.ball.y + this.ball.radius > this.paddle1.y && this.ball.y + this.ball.radius < this.paddle1.y + 100 && this.ball.dx < 0) {
            this.ball.dx = -this.ball.dx;
            let deltaY = (this.ball.y - (this.paddle1.y + this.paddle1.height / 2)) / (this.paddle1.height / 2);
            this.ball.dy = deltaY * 2;
        }
    }

    gameEnd() {
        this.renderer.drawGameOverMessage(this.score1 > this.score2 ? 1 : 2);
    }

    setup()
    {
        this.paddle1 = { x: this.canvas.width / 80, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
        this.paddle2 = { x: this.canvas.width - this.canvas.width / 40, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
        this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: 10, dx: 4, dy: 4 };
    }
    gameLoop() {
        this.movePaddles();
        this.renderer.renderingLoop(this.paddle1, this.paddle2, this.score1, this.score2, this.ball);
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        this.pingPong();
        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            let winner;
            this.ball.dx > 0 ? (this.score1 += 1, winner = 1) : (this.score2 += 1, winner = 2);
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height / 2;
            this.ball.dx = this.ball.dx > 0 ? -4 : 4;
            this.ball.dy = 4;
            this.paused = true;
            this.renderer.drawPauseMessage(winner);
            if (this.paused) return;
        }
        if (this.score1 == this.endScore || this.score2 == this.endScore) {
            this.gameEnd();
            
            this.ball.dy = 4;
            this.paused = true;
            if (this.paused) return;
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    resumeGame(event, reset = false) {
        if (event.code === 'Space') {
            if (reset === true) {
                this.score1 = 0;
                this.score2 = 0;
                this.paddle1 = { x: this.canvas.width / 80, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
                this.paddle2 = { x: this.canvas.width - this.canvas.width / 40, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
                this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: 10, dx: 4, dy: 4 };
                this.endScore = 3;
            }
            this.reset = false;

            requestAnimationFrame(() => this.gameLoop());
        }
    }
}
export default PongGame;