import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";
import chatBox from "../Chat.js";

class HomeView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Home");
    this.onStart();
  }

  onStart() {
    if (Application.getAccessToken() === null) {
      Router.reroute("/landing");
    } else {
      this._setHtml();
      Avatar.getUUid().then(() => {
        const SideBarImg = document.querySelector("#side-img");
        if (SideBarImg)
          SideBarImg.src = Avatar.url(Application.getUserInfos().userId);
      });
      // this.renderSendMessageForm();
    }
  }
  onStart() {
    if (Application.getAccessToken() === null) {
      Router.reroute("/landing");
    } else {
      this._setHtml();
    }
    try {
      Application.mainSocket.onmessage = (event) => {
        // Parse the incoming JSON
        const data = JSON.parse(event.data);
        const sender = data.sender || 0; // Default if field missing
        const message = data.message || "No message content"; // Default if field missing
        TRequest.request("GET", "/api/friends/blocks/blockslist/")
          .then((blocklist) => {
            if (!blocklist.blocks.includes(sender)) {
              TRequest.request("GET", `/api/users/userinfo/${sender}`)
                .then((nickname) => {
                  chatBox.DisplayNewMessage(message, nickname.nickname);
                })
                .catch((err) => {
                  console.error("Failed to fetch user info:", err);
                });
            }
          })
          .catch((err) => {
            console.error("Failed to fetch blocklist:", err);
          });
      };
    } catch (err) {
      console.error("Failed to process WebSocket message:", err);
    }

    Application.mainSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    Application.mainSocket.onopen = () => {
      console.log("WebSocket connection opened.");
    };

    Application.mainSocket.onclose = () => {
      console.log("WebSocket connection closed.");
    };
  }

  _setHtml() {
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `
        <h1 class="text-white display-1">${
          Application.getUserInfos().userName
        } welcome to your home page!</h1>
        <div id="message-container"></div>
      `;
    } else {
      console.error("#view-container not found in the DOM.");
    }
    const container2 = document.querySelector("#view-container");
  }
}

export default HomeView;
