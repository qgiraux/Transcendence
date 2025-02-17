import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import PongRenderer from "../pongrenderer.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Avatar from "../Avatar.js";
const BALL_RADIUS = 10;
class PongGameView extends AbstractView {
    constructor(params) {
        super(params);
        this._setTitle("Pong Game Tournament");
        this.canvas = null;
        this.renderer = null;
        this.gameStarted = false;
        this.paddle1 = null;
        this.paddle2 = null;
        this.ball = { x: 0, y: 0, radius: 10};
        this.cpaddle1 = this.paddle1;
        this.cpaddle2 = this.paddle2;
        this.cball = this.ball;
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
        this._setHTML();
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        this._setHTML();
        Application.toggleLangSelectorHide();
        this.canvasContainer = document.getElementById("canvas-container");
        this.canvas = document.getElementById("pongCanvas");
        this.canvas.width += BALL_RADIUS * 2; // Increase the width by 20
        this.canvas.height += BALL_RADIUS * 2; // Increase the height by 20
        this.messageContainer = document.getElementById("message-container");
        this.tournamentContainer = document.getElementById("tournament-data");
        if (!this.canvas || !this.canvasContainer || !this.messageContainer) {
            throw new Error(`Missing essential DOM elements`);
        }
        console.log("🎯 Successfully loaded HTML elements.");
        console.log("🖼️ Canvas Container:", this.canvasContainer);
        console.log("🎮 Pong Canvas:", this.canvas);
        this.canvasContainer.classList.add("d-none");
        this.renderer = new PongRenderer(this.canvas);
        TRequest.request("GET", `/api/tournament/details/${Application.joinedTournament}`)
            .then((tournament) => {
                this.displayTournamentProgression(tournament);
                if (this.startMessage === false){
                    Application.gameSocket.send(
                        JSON.stringify({ type: "online", data: ""})
                    );
                    this.startMessage = true;
                }
            })
       
        // Initialize paddles and ball
        this.paddle1 = {
            x: this.canvas.width / 80,
            y: this.canvas.height / 2,
            width: this.canvas.width / 80,
            height: this.canvas.height / 5,
            dy: this.canvas.height / 40,
        };
        this.paddle2 = {
            x: this.canvas.width - this.canvas.width / 40,
            y: this.canvas.height / 2,
            width: this.canvas.width / 80,
            height: this.canvas.height / 5,
            dy: this.canvas.height / 40,
        };
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: BALL_RADIUS,
        };        
        if (Application.gameSocket) {
            console.log("WebSocket connection already established.");
            try {
                Application.gameSocket.onmessage = (event) => {
                    // console.log("DATA=== ", event.data);
                    const data = JSON.parse(event.data);
                    if (data.type == "game_init") {
                        this.startGame(data);
                    }
                    else if (data.type === "countdown" ) {
                        this.handleCountdown(data);
                    }
                    else if (data.type === "game_update") {
                        this.updateGameState(data);
                    }
                    else if (data.type === "game_over") {
                        this.endGame(data);
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
        Application.gameSocket.send(JSON.stringify({ type: 'online', data: {} }));        
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
            if (!this.gameStarted) {
                this.messageContainer.textContent = "Waiting for Opponent...";
                this.gameStarted = true;
            }
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
    startGame(data) {
        console.log("IS STARTGAME CALLED", data);
        console.log(data)
        // this.canvas.style.display = "block";
        // console.log("🖥️ Pong canvas should now be visible.");
        let uri1 = "/api/users/userinfo/" + data.state.player_left.playerid;
        TRequest.request("GET", uri1)
        .then((result) => {
            this.p1name = result.username;
            console.log("p1name: ", this.p1name);
            console.log
            let uri2 = "/api/users/userinfo/" + data.state.player_right.playerid;
            TRequest.request("GET", uri2)
            .then((result) => {
                console.log("result: ", result);
                this.p2name = result.username;
                console.log("p2name: ", this.p2name);
            })
            .catch((error) => {});
        })
        .catch((error) => {});
    }
    handleCountdown(data) {
        // console.log("Countdown: ", data.data);
        if (this.startMessage === false){
            Application.gameSocket.send(
                JSON.stringify({ type: "online", data: Application.getUserInfos().userName})
            );
            this.startMessage = true;
        }
        this.messageContainer.classList.add("d-none");
        this.tournamentContainer.classList.add("d-none");
        this.canvasContainer.classList.remove("d-none");
        if (data.data === 0) {
            console.log("Game started");
            this.paused = false;
            requestAnimationFrame(this.gameLoop.bind(this));
        }
        else if (data.data > 0) {
            this.paused = true;
        }
        console.log("THIS PLAYER NAME = ", this.p1name, this.p2name);
        this.adjustToCanvas();
        this.renderer.drawCountdownMessage(
            this.cpaddle1,
            this.cpaddle2,
            this.score1,
            this.score2, 
            data.data,
            this.p1name,
            this.p2name
        );
    }
    updateGameState(data) {
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
    endGame(data) {
        this.score1 = data.state.player_left.score;
        this.score2 = data.state.player_right.score;
    
        this.canvasContainer.classList.add("d-none");
        TRequest.request("GET", `/api/tournament/details/${Application.joinedTournament}`)
            .then((tournament) => {
                this.displayTournamentProgression(tournament);
            })
        this.tournamentContainer.classList.remove("d-none");
        console.log("Game Over");
        this.isGameOver = true; // Stop game loop when the game ends
    }
    gameLoop() {
        if (this.isGameOver || this.paused) return;
        if (this.startMessage === false){
            Application.gameSocket.send(
                JSON.stringify({ type: "online", data: ""})
            );
            this.startMessage = true;
        }
        this.update_keys();
        this.adjustToCanvas()
        this.renderer.renderingLoop(
            this.cpaddle1,
            this.cpaddle2,
            this.score1,
            this.score2,
            this.cball,
            this.p1name,
            this.p2name
        );
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    adjustToCanvas() {
        // Copy the current positions of paddles and ball
        this.cpaddle1 = { ...this.paddle1 };
        this.cpaddle2 = { ...this.paddle2 };
        this.cball = { ...this.ball };
        // Adjust the coordinates by BALL_RADIUS to account for the canvas border
        this.cpaddle1.x += BALL_RADIUS;
        this.cpaddle1.y += BALL_RADIUS;
        this.cpaddle2.x -= BALL_RADIUS;
        this.cpaddle2.y += BALL_RADIUS;
        this.cball.x += BALL_RADIUS;
        this.cball.y += BALL_RADIUS;    
    }
    displayTournamentProgression(tournament) {
        let roundNumber = tournament["size"];
        //create the tournament card div
        this.tournamentContainer.classList.add(
        "tournament-card",
        "w-75",
        "text-white",
        "border",
        "p-3"
        );
        this.tournamentContainer.innerHTML = `
                    <div class="row mt-1 d-flex  justify-content-center align-items-center mx-auto">
                    <h4>${tournament["tournament name"]}</h4>
                    <div class="row d-flex mx-auto justify-content-center align-items-center p-1" id="rounds-container"></div>
                    `;
        const roundsContainer = this.tournamentContainer.querySelector("#rounds-container");
        for (; roundNumber >= 1; roundNumber = roundNumber / 2) {
        let roundDiv = document.createElement("div");
        roundDiv.classList.add(
            "col",
            "d-flex",
            "flex-column",
            "justify-content-center"
        );
        roundDiv.id = `round-${roundNumber}`;
        roundDiv = this.populateRound(tournament, roundDiv, roundNumber);
        roundsContainer.appendChild(roundDiv);
        }
    }
    populateRound(tournament, roundDiv, roundNumber) {
        if (roundNumber == 1) {
            roundDiv.appendChild(
              this.createAvatarElementFromId(
                this.getIdfromTournament(tournament, "1", 0),
                90,
                true
              )
            );
          }
          let secondPlayer = roundNumber - 1;
          for (secondPlayer = 1; secondPlayer < roundNumber; secondPlayer += 2) {
            roundDiv.appendChild(
              this.createRoundMatchHTML(
                tournament,
                String(roundNumber),
                secondPlayer - 1,
                secondPlayer
              )
            );
          }
          return roundDiv;
    }
    createRoundMatchHTML(tournament, round, indexPlayerOne, indexPlayertwo) {
        const match = document.createElement("div");
        match.classList.add(
          "match",
          "d-flex",
          "justify-content-center",
          "align-items-center",
          "mb-2",
          "p-1",
          "border",
          "gap-1"
        );
        const idPlayerOne = this.getIdfromTournament(
          tournament,
          round,
          indexPlayerOne
        );
        const idPlayerTwo = this.getIdfromTournament(
          tournament,
          round,
          indexPlayertwo
        );
        match.appendChild(this.createAvatarElementFromId(idPlayerOne, 50, false));
        match.appendChild(this.createAvatarElementFromId(idPlayerTwo, 50, false));
        return match;
      }
    getIdfromTournament(tournament, round, index) {
    if (!tournament["rounds"][round]) return 0;
    if (tournament["rounds"][round].length <= index) return 0;
    return tournament["rounds"][round][index];
    }
    getProfileLinkformId(id) {
    if (id === 0) return "";
    return `/profile/${id}`;
    }
    createAvatarElementFromId(id, size, winner) {
        const img = document.createElement("img");
        img.classList.add("rounded", "rounded-circle");
        if (winner) {
          img.classList.add(
            "rounded",
            "rounded-circle",
            "border",
            "border-warning"
          );
        }
        img.width = size;
        img.height = size;
        if (id !== 0) {
          img.src = Avatar.url(id);
          img.dataset.avatar = id;
          const link = document.createElement("a");
          link.dataset.link = 1;
          link.href = this.getProfileLinkformId(id);
          link.appendChild(img);
          return link;
        } else {
          img.src = "/img/question_mark_icon.png";
          return img;
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
            </style>
            <h1>Tournament Game</h1>
            <div id="canvas-container">
            <canvas id="pongCanvas" width="800" height="400"></canvas>
            </div>
            <div id="tournament-data"></div>
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