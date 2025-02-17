import PongRenderer from "./pongrenderer.js";

class PongGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id ${canvasId} not found`);
        }
        this.renderer = new PongRenderer(this.canvas);
        
        this.paddle1 = {
            x: this.canvas.width / 160,
            y: this.canvas.height / 2,
            width: this.canvas.width / 80,
            height: this.canvas.height / 5,
            dy: this.canvas.height / 40 
        };
        this.paddle2 = { 
            x: this.canvas.width - this.canvas.width / 160 - this.canvas.width / 80,
            y: this.canvas.height / 2,
            width: this.canvas.width / 80,
            height: this.canvas.height / 5,
            dy: this.canvas.height / 40,
        };
        this.ball = { 
            x: this.canvas.width / 2,
            y: this.canvas.height / 2, 
            radius: 10, 
            dx: Math.random() > 0.5 ? 4 : -4, 
            dy: 4 
        };
        this.endScore = 3;
        this.score1 = 0;
        this.score2 = 0;
        this.commands = { up: 0, down: 0, w: 0, s: 0 };
        
        this.paused = true;
        this.reset = true;
        this.waitingForServe = true;
        this.renderer.drawStartMessage(this.paddle1, this.paddle2);

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
        if (this.commands.up) 
            this.paddle2.y = Math.max(this.paddle2.y - this.paddle2.dy, this.paddle2.height / 2);
        if (this.commands.down) 
            this.paddle2.y = Math.min(this.paddle2.y + this.paddle2.dy, this.canvas.height - this.paddle2.height / 2);
        if (this.commands.w) 
            this.paddle1.y = Math.max(this.paddle1.y - this.paddle1.dy, this.paddle1.height / 2);
        if (this.commands.s) 
            this.paddle1.y = Math.min(this.paddle1.y + this.paddle1.dy, this.canvas.height - this.paddle1.height / 2);
    }

    pingPong() {
        if (this.ball.y + this.ball.radius > this.canvas.height || this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
        }
        if (this.ball.x + this.ball.radius > this.canvas.width - this.paddle2.width * 2 && 
            this.ball.y > this.paddle2.y - this.paddle2.height / 2 && 
            this.ball.y < this.paddle2.y + this.paddle2.height / 2 && this.ball.dx > 0) {
            let deltaY = this.ball.y - this.paddle2.y;
            let angle = deltaY / (this.paddle2.height / 2);
            this.ball.dx = -this.ball.dx;
            this.ball.dy = angle * 4;
        } 
        else if (this.ball.x - this.ball.radius < this.paddle1.width * 2 && 
             this.ball.y > this.paddle1.y - this.paddle1.height / 2 && 
             this.ball.y < this.paddle1.y + this.paddle1.height / 2 && this.ball.dx < 0) {
            let deltaY = this.ball.y - this.paddle1.y;
            let angle = deltaY / (this.paddle1.height / 2);
            this.ball.dx = -this.ball.dx;
            this.ball.dy = angle * 4;
        }
    }

    gameEnd() {
        this.renderer.drawScore(this.score1, this.score2);
        this.renderer.drawGameOverMessage(this.score1 > this.score2 ? 1 : 2);
        this.reset = true;
        this.paused = true;
        this.waitingForServe = true;
    }

    gameLoop() {
        if (this.waitingForServe) return; // Don't move the ball until served

        this.movePaddles();
        this.renderer.renderingLoop(this.paddle1, this.paddle2, this.score1, this.score2, this.ball);
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        this.pingPong();

        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            this.score1 += this.ball.dx > 0 ? 1 : 0;
            this.score2 += this.ball.dx < 0 ? 1 : 0;
            
            if (this.score1 === this.endScore || this.score2 === this.endScore) {
                this.resetBall();
                this.ball.dx = Math.random() > 0.5 ? 4 : -4;
                this.gameEnd();
                this.paused = true;
                this.waitingForServe = true;
                return;
            }
            else {
                this.resetBall();
                this.paused = true;
                this.waitingForServe = true;
                this.renderer.drawScore(this.score1, this.score2);
                this.renderer.drawPauseMessage(this.score1 > this.score2 ? 1 : 2);
                return;
            }
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = this.ball.dx > 0 ? -4 : 4;
        this.ball.dy = 4;
    }

    resumeGame(event) {
        if (event.code !== 'Space' || !this.paused) return;

        this.paused = false;
        if (this.reset) {
            this.score1 = 0;
            this.score2 = 0;
            this.paddle1.y = this.canvas.height / 2;
            this.paddle2.y = this.canvas.height / 2;
            this.reset = false;
        }
        this.waitingForServe = false;
        requestAnimationFrame(() => this.gameLoop());
    }
}

export default PongGame;
