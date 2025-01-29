import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import chatBox from "../Chat.js";
import Alert from "../Alert.js";
import TRequest from "../TRequest.js";
import PongGame from "../localpong.js";

class HomeView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Home");
    this.domText = {};
    this.messages = {};
    this.init();
  }

  async init() {
    await Application.setLanguage(Application.lang);
    await this.getMessages();
    this.onStart();
  }

  async getMessages() {
    await Application.loadLocalization();
    //  console.log("Translation is loaded ");
    this.domText.Title = await Application.localization.t("titles.home");
    this.domText.welcomeMessage = await Application.localization.t("home.welcome");
    this.domText.seeFriends =  await Application.localization.t("home.friends");
    this.domText.manageTournaments = await Application.localization.t("home.tournaments");
  }

  listenForLanguageChange() {
    const languageSelector = document.getElementById("language-selector-container");
    if (languageSelector) {
      this.addEventListener(languageSelector, "change", async (event) => {
        const selectedLanguage = event.target.value;
        console.log(selectedLanguage);
        await Application.setLanguage(selectedLanguage);
        await this.getMessages(); 
        await Application.applyTranslations();
        this.setHtml();
      });
    }
  }

  onStart() {
    if (Application.getAccessToken() === null) {
      Router.reroute("/landing");
    } else {
      this._setHtml();
    }
    if (Application.mainSocket) {
      console.log("WebSocket connection already established.");
      try {
        Application.mainSocket.onmessage = (event) => {
          // Parse the incoming JSON
          console.log("WebSocket message received---:", event);
          let data = JSON.parse(event.data);
          const sender = data.sender || 0; // Default if field missing
          const group = data.group || "No group"; // Default if field missing
          let message = data.message || "No message content"; // Default if field missing
          console.log("quoted message: ", message);
          message = message.slice(1, -1); // Remove the first and last characters
          console.log("dequoted message: ", message);
          const type = data.type || "none"; // Default if field missing
          
          if (type === "chat")
          {
            TRequest.request("GET", "/api/friends/blocks/blockslist/").then(blocklist => {
              if (!blocklist.blocks.includes(sender)) 
              {
                chatBox.DisplayNewMessage(message, sender);
              }
            }).catch(err => {console.error("Failed to fetch blocklist:", err);});
          }
          if (type === "notification")
          {
            // Display the notification
            Alert.classicMessage(type, message)
          }
          if (type === "invite")
          {
            // Display the invite
            TRequest.request("GET", `/api/users/userinfo/${sender}`).then(username => {
              console.log(username);
              const textmessage = `${username.username} has invited you to a game!`;
              const link = message;
              console.log(`link: ${link} , textmessage: ${textmessage}`);
              Alert.inviteMessage(type, textmessage, link)
            }).catch(err => {console.error("Failed to fetch user info:", err);});
          }
          console.log("checkpoint 2");
          if (type === "game")
          {
            console.log("game invite received");
            // Display the invite
            TRequest.request("GET", `/api/users/userinfo/${sender}`).then(username => {
              console.log(username);
              const textmessage = `your game is starting!`;
              const link = message;
              Router.reroute("/pong");
              console.log(`link: ${link} , textmessage: ${textmessage}`);
              Alert.inviteMessage(type, textmessage, link)
              Application.gameSocket.send(JSON.stringify({ type: 'join', data: { userid: Application.getUserInfos().userId, name: link } }));
            }).catch(err => {console.error("Failed to fetch user info:", err);});
            
          }
          if (type === "GOTO")
          {
            // Display the alert
            Router.reroute(message);
          }
        }
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
    } else {
      console.error("WebSocket connection not established.");
    }

    if (Application.gameSocket) {
      console.log("WebSocket connection already established.");
      try {
        Application.gameSocket.onmessage = (event) => {
          // Parse the incoming JSON
          console.log("gameSocket message received----:", event.data);
          const data = JSON.parse(event.data);
          const sender = data.sender || 0; // Default if field missing
          const group = data.group || "No group"; // Default if field missing
          const message = data.message || "No message content"; // Default if field missing
          const type = data.type || "none"; // Default if field missing
          if (type === "GOTO")
          {
            // Display the alert
            Router.reroute(message);
          }
        }
      } catch (err) {
        console.error("Failed to process WebSocket message:", err);
      }
    
      Application.gameSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      Application.gameSocket.onopen = () => {
        console.log("WebSocket connection opened.");
      };

      Application.gameSocket.onclose = () => {
        console.log("WebSocket connection closed.");
      };
    } 
    else {
      console.error("gameSocket connection not established.");
    }
}

  _setHtml() {
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `
        <style>
          #pongCanvas {
        display: block; /* Ensures the canvas behaves like a block-level element */
        margin: auto; /* Centers horizontally */
          }
        </style>
        <h1 class="text-white display-1">${
          Application.getUserInfos().userName
        }</h1>
        <h2><small>${this.domText.welcomeMessage}</small></h2>
        <div class="container mt-4">
          <div class="row ">
            <div class="col-md-6 d-flex align-items-center justify-content-center">
              <div class="text-center">
                <a href="/friends" data-link class="btn">
                  <i class="bi bi-people display-3"></i>
                  <i class="bi bi-arrow-right" id="homeIcon"></i>
                  <p class="mt-2">${this.domText.seeFriends}</p></a>
              </div>
            </div>
            <div class="col-md-6 d-flex align-items-center justify-content-center">
              <div class="text-center">
                <a href="/tournaments" data-link class="btn">
                  <i class="bi bi-trophy display-3"></i>
                  <i id="homeIcon" class="bi bi-arrow-right"></i>
                  <p class="mt-2">${this.domText.manageTournaments}</p></a>
              </div>
            </div>
          </div>
          <canvas id="pongCanvas" width="800" height="400"></canvas>
        </div>
        
        <div id="message-container"></div>
      `;
  
      // Instantiate PongGame and start the game loop
      const pongGame = new PongGame('pongCanvas');
      pongGame.gameLoop();
    } else {
      console.error("#view-container not found in the DOM.");
    }
  }
   
}

export default HomeView;
