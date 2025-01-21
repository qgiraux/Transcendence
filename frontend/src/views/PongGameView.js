import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import PongRenderer from "../pongrenderer.js";




class PongGameView extends AbstractView {
    canvas = null;
    renderer = null;

    // let player1 = "";
    // let player2 = "";
    // round = "";
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
        if(Application.gameSocket) 
        {
          console.log("WebSocket connection already established.");
          this.canvas = document.getElementById('pongCanvas');
          this.renderer = new PongRenderer(this.canvas);

          let score1 = 0, score2 = 0;
          let p1name = "", p2name = "";

        Application.gameSocket.onopen = function () {
            console.log('WebSocket connection established');
            Application.gameSocket.send(JSON.stringify({ type: 'create', data: { name: 'newgame' } }));
            Application.gameSocket.send(JSON.stringify({ type: 'join', data: { userid: '1', name: 'newgame' } }));
        };

        Application.gameSocket.onmessage = function (event) {
            console.log(event.data);
            const data = JSON.parse(event.data);

            if (data.type === 'game_over') {
                // Update final scores
                console.log(data);
                score1 = data.state.player_left.score; 
                score2 = data.state.player_right.score;
                // Draw final scores
                this.renderer.clearCanvas();
                this.renderer.drawScore(score1, score2);
                this.renderer.drawGameOverMessage(data.state.winner);

                console.log('Game Over');
                console.log(data);
                isGameOver = true; // Stop game loop when the game ends
            } else {
                // Update game state for ongoing gameplay
                this.renderer.clearCanvas();
                this.renderer.drawScore(data.player_left.score, data.player_right.score);
                this.renderer.drawPaddle(data.player_left.paddle_y);
                this.renderer.drawPaddle(data.player_right.paddle_y);
                this.renderer.drawBall(data.ball);
                p1name = data.player_left.playerid;
                p2name = data.player_right.playerid;
                player1 = p1name;
                player2 = p2name;
            }
            
        };

        Application.gameSocket.onclose = function () {
            console.log('WebSocket connection closed');
            document.getElementById('game-status').innerText = "Connection closed";
        };

        Application.gameSocket.onerror = function (error) {
            console.error('WebSocket error:', error);
        };
          
          try {
            Application.gameSocket.onmessage = (event) => {
            console.log("WebSocket message received: ", event.data);
            const data = JSON.parse(event.data);
            }
          } catch (error) {
            console.error("WebSocket error: ", error);
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
            <canvas id="pongCanvas" width="800" height="400"></canvas>
            <div id="message-container"></div>
          `;


        } else {
          console.error("#view-container not found in the DOM.");
        }
    }
}

export default PongGameView;

{/* <h2 class="text-white display-2">${player1} against ${player2} - Round #${round}</h2> */}
