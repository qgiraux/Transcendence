import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import PongRenderer from "../pongrenderer.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";

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
        this.startMessage = false
        this.isGameOver = false;
        this.up = false;
        this.down = false;
      
        this.onStart();
    }

    childOnDestroy() {
        console.log("Destroying PongGameView");
        if (this.isGameOver === false)
            Application.gameSocket.send(JSON.stringify({ type: 'giveup', data: "" }));
        
    }
    onStart() {
        
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));

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
        
        if (Application.gameSocket) {
            console.log("WebSocket connection already established.");
            try {
                // Application.gameSocket.onopen = () => {
                //     console.log("WebSocket connection established"); 
                // };

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
                    } 
                    else if (data.type === "countdown" ) {
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
                    } 
                    else if (data.type === "game_init" ) {
                        // this.p1name = data.state.player_left.playerid;
                        // this.p2name = data.state.player_right.playerid;
                        console.log("Game init: ", data);
                        let uri1 = "/api/users/userinfo/" + data.state.player_left.playerid;
                        TRequest.request("GET", uri1)
                        .then((result) => {
                            this.p1name = result.username;
                            console.log("p1name: ", this.p1name);
                            let uri2 = "/api/users/userinfo/" + data.state.player_right.playerid;
                            TRequest.request("GET", uri2)
                            .then((result) => {
                                this.p2name = result.username;
                                this.renderer.drawStartMessage(
                                    this.paddle1,
                                    this.paddle2,
                                    this.p1name,
                                    this.p2name
                                );
                            })
                            .catch((error) => {
                                Alert.errorMessage("Error", error.message);
                            });
                        })
                        .catch((error) => {
                            Alert.errorMessage("Error", error.message);
                        });

                        
                    } 
                    else if (data.type === "game_update") {
                        // Update game state for ongoing gameplay
                        const datum = data.state;
                        // console.log("Game state: ", datum);
                        if (this.p1name === ""){
                            this.p1name = datum.player_left.playerid;
                        }
                        if (this.p2name === ""){
                            this.p2name = datum.player_right.playerid;
                        }
                        this.score1 = datum.player_left.score;
                        this.score2 = datum.player_right.score;
                        this.paddle1.y = datum.player_left.paddle_y * 4;
                        this.paddle2.y = datum.player_right.paddle_y * 4;
                        this.ball.x = datum.ball.position[0] * 4;
                        this.ball.y = datum.ball.position[1] * 4;
                        // console.log("newBall: ", newBallX, newBallY);
                        // console.log("ball: ", this.ball.x, this.ball.y);
                    }
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
            this.update_keys();
            if (this.startMessage === false) {
                console.log("Sending 'online' message");
                Application.gameSocket.send(
                    JSON.stringify({ type: "online", data: ""})
                );
                this.startMessage = true;
            }
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

    update_keys() {
        if (this.up && !this.down) {
            Application.gameSocket.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'up' } }));
            console.log("UP");
        }
        if (this.down && !this.up) {
            Application.gameSocket.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'down' } }));
            console.log("DOWN");
        }
    }
    handleKeyDown(event) {
    //   console.log("Key pressed: ", event.key);
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
            // Application.gameSocket.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'up' } }));
            // console.log("UP");
            this.up = true;
            break;
        case 'ArrowDown':
        case 's':
            // Application.gameSocket.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'down' } }));
            // console.log("DOWN");
            this.down = true;
            break;
        case ' ':
            Application.gameSocket.send(JSON.stringify({ type: 'ready', data: { direction: 'ready' } }));
            // console.log("READY");
            break;
      }
    }
    handleKeyUp(event) {
        // console.log("Key pressed: ", event.key);
        switch (event.key) {
          case 'ArrowUp':
          case 'w':
              // Application.gameSocket.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'up' } }));
              // console.log("UP");
              this.up = false;
              break;
          case 'ArrowDown':
          case 's':
              // Application.gameSocket.send(JSON.stringify({ type: 'move_paddle', data: { direction: 'down' } }));
              // console.log("DOWN");
              this.down = false;
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
