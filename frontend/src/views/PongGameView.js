import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import PongGame  from "../localpong.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Avatar from "../Avatar.js";

class PongGameView extends AbstractView() {
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
            <h1 class="text-white display-1">${
              Application.getUserInfos().userName
            } welcome to your home page!</h1>
            <canvas id="pongCanvas" width="800" height="400"></canvas>
            <div id="message-container"></div>
          `;
        } else {
          console.error("#view-container not found in the DOM.");
        }
    }


}
