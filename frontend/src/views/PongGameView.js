import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import PongRenderer from "../pongrenderer.js";

class PongGameView extends AbstractView() {
    canvas;
    renderer;
    constructor(params) {
        super(params);
        this._setTitle("Pong Game Tournament");
        this.onStart();
    }

    onStart() {
        if (Application.getAccessToken() == null) {
            setTimeout(() => {
                Router.reroute("/landing");
            }, 50);
                return;
        }

        this._setHTML();
        this.isGameOver = false;
        if(Application.mainSocket) {
          console.log("WebSocket connection already established.");
          this.canvas = document.getElementById('pongCanvas');
          this.renderer = new PongRenderer(canvas);
          let paddle1y = 100, paddle2y = 100;
          let ballx = 200, bally = 100;
          let score1 = 0, score2 = 0;
          let p1name = "", p2name = "";
          const ballradius = 4;
          const paddleheight = 40, paddlewidth = 4;
          const paddle1x = 4, paddle2x = canvas.width - paddlewidth - 4;

        Application.mainSocket.onopen = function () {
            console.log('WebSocket connection established');
            Application.mainSocket.send(JSON.stringify({ type: 'create', data: { name: 'newgame' } }));
            Application.mainSocket.send(JSON.stringify({ type: 'join', data: { userid: '1', name: 'newgame' } }));
        };

        Application.mainSocket.onmessage = function (event) {
            console.log(event.data);
            const data = JSON.parse(event.data);

            if (data.type === 'game_over') {
                // Update final scores
                console.log(data);
                score1 = data.state.player_left.score; 
                score2 = data.state.player_right.score;
                // Draw final scores
                this.renderer.

                console.log('Game Over');
                console.log(data);

                // Clear the game canvas and display winner information
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "blue";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "white";
                ctx.font = "40px Arial";

                if (data.state && data.state.winner) {
                    ctx.textAlign = "center";
                    ctx.fillText("WINNER :", canvas.width / 2, 70);
                    ctx.fillText(data.state.winner, canvas.width / 2, 110);
                } else {
                    ctx.textAlign = "center";
                    ctx.fillText("WINNER : Unknown", canvas.width / 2, 100);
                }
                isGameOver = true; // Stop game loop when the game ends
            } else {
                // Update game state for ongoing gameplay
                paddle1y = data.player_left.paddle_y * 2;
                paddle2y = data.player_right.paddle_y * 2;
                ballx = data.ball.position[0] * 2;
                bally = data.ball.position[1] * 2;
                score1 = data.player_left.score;
                score2 = data.player_right.score;
                p1name = data.player_left.playerid;
                p2name = data.player_right.playerid;
            }
            
        };

        ws.onclose = function () {
            console.log('WebSocket connection closed');
            document.getElementById('game-status').innerText = "Connection closed";
        };

        ws.onerror = function (error) {
            console.error('WebSocket error:', error);
        };
          
          try {
            Application.mainSocket.onmessage = (event) => {
            console.log("WebSocket message received: ", event.data);
            const data = JSON.parse(event.data);
            }
          }
        }

    }

    _setHTML() {
        const container = document.querySelector("#view-container");
        if (container) {
          container.innerHTML = `
            <style>
              #pongCanvas {
            display: block; /* Ensures the canvas behaves like a block-level element */
            margin: auto; /* Centers horizontally */
              }
              #view-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh; /* Full viewport height */
              }
            </style>
            <h1 class="text-white display-1">Tournament Game</h1>
            <h2 class="text-white display-2">${user1} against ${user2} - Round #${round}</h2>
            <canvas id="pongCanvas" width="800" height="400"></canvas>
            <div id="message-container"></div>
          `;
        } else {
          console.error("#view-container not found in the DOM.");
        }
    }
}
