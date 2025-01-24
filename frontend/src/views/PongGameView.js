import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import PongRenderer from "../pongrenderer.js";

class PongGameView extends AbstractView {
    constructor(params) {
        super(params);
        this._setTitle("Pong Game Tournament");

        this.canvas = null;
        this.renderer = null;

        this.paddle1 = null;
        this.paddle2 = null;
        this.ball = { x: 0, y: 0, radius: 10};
        this.score1 = 0;
        this.score2 = 0;
        this.p1name = "";
        this.p2name = "";
        this.paused = true;

        this.isGameOver = false;
      
        this.onStart();
    }

    onStart() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));

        this._setHTML();

        this.canvas = document.getElementById("pongCanvas");
        

        if (!this.canvas) {
            throw new Error(`Canvas element with id 'pongCanvas' not found`);
        }

        this.renderer = new PongRenderer(this.canvas);

        // Initialize paddles and ball
        this.paddle1 = {
            x: this.canvas.width / 80,
            y: this.canvas.height / 2 - this.canvas.height / 8,
            width: this.canvas.width / 80,
            height: this.canvas.height / 5,
            dy: this.canvas.height / 40,
        };
        this.paddle2 = {
            x: this.canvas.width - this.canvas.width / 40,
            y: this.canvas.height / 2 - this.canvas.height / 8,
            width: this.canvas.width / 80,
            height: this.canvas.height / 5,
            dy: this.canvas.height / 40,
        };
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 10,
        };
        this.renderer.drawStartMessage(
            this.paddle1,
            this.paddle2,
            this.p1name,
            this.p2name
        );

        if (Application.gameSocket) {
            console.log("WebSocket connection already established.");
            try {
                Application.gameSocket.onopen = () => {
                    console.log("WebSocket connection established");
                    Application.gameSocket.send(
                        JSON.stringify({ type: "create", data: { name: "newgame" } })
                    );
                    Application.gameSocket.send(
                        JSON.stringify({ type: "join", data: { userid: "1", name: "newgame" } })
                    );
                };

                Application.gameSocket.onmessage = (event) => {
                    // console.log("DATA=== ", event.data);
                    const data = JSON.parse(event.data);

                    if (data.type === "game_over") {
                        this.score1 = data.state.player_left.score;
                        this.score2 = data.state.player_right.score;

                        // Draw final scores
                        this.renderer.clearCanvas();
                        this.renderer.drawScore(this.score1, this.score2);
                        this.renderer.drawGameOverMessage(data.state.winner);

                        console.log("Game Over");
                        this.isGameOver = true; // Stop game loop when the game ends
                    } else if (data.type === "countdown" ) {
                        console.log("Countdown: ", data.data);
                        if (data.data === 0) {
                            console.log("Game started");
                            this.paused = false;
                            requestAnimationFrame(loop);
                        }
                        else if (data.data > 0) {
                            this.paused = true;
                            
                        }
                        this.renderer.drawCountdownMessage(
                            this.paddle1,
                            this.paddle2,
                            this.score1,
                            this.score2, 
                            data.data,
                            this.p1name,
                            this.p2name
                    );
                    } else {
                        // Update game state for ongoing gameplay
                        console.log("Game state: ", data);
                        this.p1name = data.player_left.playername;
                        this.p2name = data.player_right.playername;
                        this.score1 = data.player_left.score;
                        this.score2 = data.player_right.score;
                        this.paddle1.y = data.player_left.paddle_y * 4;
                        this.paddle2.y = data.player_right.paddle_y * 4;
                        this.ball.x = data.ball.position[0] * 4;
                        this.ball.y = data.ball.position[1] * 4;
                        // console.log("newBall: ", newBallX, newBallY);
                        // console.log("ball: ", this.ball.x, this.ball.y);
                    }
                };

                Application.gameSocket.onclose = () => {
                    console.log("WebSocket connection closed");
                    document.removeEventListener('keydown', (event) => this.handleKeyDown(event));
                    // document.getElementById("game-status").innerText = "Connection closed";
                };

                Application.gameSocket.onerror = (error) => {
                    console.error("WebSocket error:", error);
                };
            } catch (err) {
                console.error("Failed to process WebSocket message: ", err);
            }
        } else {
            console.error("gameSocket connection not established.");
        }

        const loop = () => {
          // console.log("ball  : ", this.ball);
            if (!this.isGameOver && this.paused === false) {
              
                this.renderer.renderingLoop(
                    this.paddle1,
                    this.paddle2,
                    this.score1,
                    this.score2,
                    this.ball,
                    this.p1name,
                    this.p2name

                    
                );
                requestAnimationFrame(loop);
            }
        };
        requestAnimationFrame(loop);
    }


    handleKeyDown(event) {
      console.log("Key pressed: ", event.key);
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
            Application.gameSocket.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'up' } }));
            console.log("UP");
            break;
        case 'ArrowDown':
        case 's':
            Application.gameSocket.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'down' } }));
            console.log("DOWN");
            break;
        case ' ':
            Application.gameSocket.send(JSON.stringify({ type: 'ready', data: { direction: 'ready' } }));
            console.log("READY");
            break;
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
          const canvas = document.getElementById("pongCanvas");
          canvas.focus(); // Ensure the canvas is focusable
      } else {
          console.error("#view-container not found in the DOM.");
      }

    }
}

export default PongGameView;
