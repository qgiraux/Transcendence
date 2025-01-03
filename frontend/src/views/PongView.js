import Application from "../Application.js";
import AbstractView from "./AbstractView";
import Alert from "../Alert.js";
import TRequest  from "../TRequest.js";
import Router from "../Router.js";

class PongView extends AbstractView {
    constructor(params) {
        super(params);
        this._setTitle("PongView");
        this.onStart();
    }

    onStart() {
        // Check if the user is correctly connected
        if (Application.getAccessToken() == null) {
            setTimeout(() => {
                Router.reroute("/landing");
            }, 50);
            return;
        }

        // Get the HTML
        this.setHtml();

        // Open the Websocket
        this.setupWebSocket();

        // Start the game loop
        this.gameLoop();

    }

    setHtml() {
        const container = document.querySelector("#view-container");
        if (container) {
            container.innerHTML = `
             <div class="col-10 mx-auto justify-content-center mb-5">
                    <canvas id="gameCanvas" width="200" height="100"></canvas>
                </div>
            </div>`;
        }
    }

    setupWebSocket() {
        this.ws = new WebSocket('wss://localhost:5000/ws/pong/');

        this.ws.onopen = () => {
            console.log('WebSocket connection established');
            // remove this next line when connected to tournaments => the tournament API creates the game)
            this.ws.send(JSON.stringify({ type: 'create', data: { name: 'newgame' } }));
            this.ws.send(JSON.stringify({ type: 'join', data: { userid: Application.getUserInfos().userId, name: 'newgame' } }));
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.paddle1y = data.player_left.paddle_y;
            this.paddle2y = data.player_right.paddle_y;
            this.ballx = data.ball.position[0];
            this.bally = data.ball.position[1];
            console.log('Game Update:', this.paddle1y, this.paddle2y, this.ballx, this.bally);
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
            document.getElementById('game-status').innerText = "Connection closed";
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // Paddle control via keyboard
        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp') {
                this.ws.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'UP' } }));
            } else if (event.key === 'ArrowDown') {
                this.ws.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'DOWN' } }));
            }
        });
    }

    render() {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Clear canvas before each render
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);

        // Draw paddles
        this.drawPaddle(this.paddle1x, this.paddle1y);
        this.drawPaddle(this.paddle2x, this.paddle2y);

        // Draw ball
        this.drawBall();
    }

    drawPaddle(x, y) {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "white";
        ctx.fillRect(x, y, 2, 20); // Draw the paddle
    }

    drawBall() {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(this.ballx, this.bally, 2, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
    }

    gameLoop() {
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }
}

export default PongView;
