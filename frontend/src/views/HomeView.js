import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Router from "../Router.js";

class HomeView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Home");
    this.onStart();
  }
  renderSendMessageForm() {
    const container = document.querySelector("#view-container");
    if (container) {
      const formHtml = `
        <div>
          <input type="text" id="messageInput" placeholder="Enter your message" />
          <input type="text" id="groupInput" placeholder="Enter group (optional)" />
          <select id="messageType">
            <option value="text">Text</option>
            <option value="json">JSON</option>
          </select>
          <textarea id="jsonInput" placeholder="Enter JSON message (optional)"></textarea>
          <button id="sendMessageButton">Send Message</button>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', formHtml);

      document.getElementById("sendMessageButton").addEventListener("click", () => this.sendMessage());
    } else {
      console.error("#view-container not found in the DOM.");
    }
  }

  onStart() {
    if (Application.getAccessToken() === null) {
      Router.reroute("/landing");
    } else {
      this._setHtml();
      this.renderSendMessageForm();
    }
  }
  sendMessage() {
      const message = messageInput.value;
      const group = groupInput.value || 'global_chat';
      const type = messageType.value;

      if (message && Application.mainSocket && Application.mainSocket.readyState === WebSocket.OPEN) {
          const data = {
              type: type,
              group: group,
              message: message
          };
          Application.mainSocket.send(JSON.stringify(data));
          messageInput.value = ''; // Clear input after sending
      }
  }
  onStart() {
    if (Application.getAccessToken() === null) {
      Router.reroute("/landing");
    } else {
      this._setHtml();
    }
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
  
      Application.mainSocket.onmessage = (event) => {
        try {
          // Parse the incoming JSON
          const data = JSON.parse(event.data);
          const sender = data.sender || "Unknown Sender"; // Default if field missing
          const message = data.message || "No message content"; // Default if field missing
  
          console.log("Parsed message data:", { sender, message });
  
          const messageContainer = document.querySelector("#message-container");
            if (messageContainer) {
            const newMessage = document.createElement("div");
            newMessage.className = "message";
            newMessage.style.color = "white"; // Set the text color to white
            newMessage.textContent = `${sender}: ${message}`; // Format the display
            messageContainer.appendChild(newMessage);
          } else {
            console.error("Message container not found in the DOM.");
          }
        } catch (err) {
          console.error("Failed to process WebSocket message:", err);
        }
      };
  
      Application.mainSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
  
      Application.mainSocket.onopen = () => {
        console.log("WebSocket connection opened.");
      };
  
      Application.mainSocket.onclose = () => {
        console.log("WebSocket connection closed.");
      };
    } else {
      console.error("#view-container not found in the DOM.");
    }
    const container2 = document.querySelector("#view-container");
    if (container2) {
      const formHtml = `
        <div>
          <input type="text" id="messageInput" placeholder="Enter your message" />
          <input type="text" id="groupInput" placeholder="Enter group (optional)" />
          <select id="messageType">
            <option value="chat">chat</option>
            <option value="notification">notif</option>
          </select>
          <button id="sendMessageButton">Send Message</button>
        </div>
      `;
      container2.insertAdjacentHTML('beforeend', formHtml);

      document.getElementById("sendMessageButton").addEventListener("click", () => this.sendMessage());
    } else {
      console.error("#view-container not found in the DOM.");
    }
  }
}  

export default HomeView;


