// script.js
import Application from "./Application.js";
import TRequest from "./TRequest.js"; // Assuming TRequest is defined in TRequest.js

// Elements
const chatBtn = document.getElementById("chat-btn");
const chatPopup = document.getElementById("chat-popup");
const closeChat = document.getElementById("close-chat");
const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chat-messages");
const chatGroup = document.getElementById("groupInput");

// Show the chat popup
chatBtn.addEventListener("click", () => {
  chatPopup.style.display = "flex";
  chatBtn.style.display = "none";
});

// Close the chat popup
closeChat.addEventListener("click", () => {
  chatPopup.style.display = "none";
  chatBtn.style.display = "block";
});

// if (sendBtn !== null) {
const sendMessage = async () => {
  let group;
  if (chatGroup.value === "global_chat" || !chatGroup.value) {
    group = "global_chat";
  } else {
    let username = { username: chatGroup.value };
    await TRequest.request("POST", "/api/users/userid/", username)
      .then((value) => {
        group = "user_" + value["id"];
      })
      .catch((err) => {
        console.log("no user with this name:", err);
        group = "none";
      });
  }
  // const group = chatGroup.value || 'global_chat';
  // const group = chatGroup.value || 'global_chat';
  const body = {
    message: chatInput.value,
    group: group,
    type: "chat",
    sender: Application.getUserInfos().userId,
  };
  Application.mainSocket.send(JSON.stringify(body));
  chatInput.value = "";
};

sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});
// }
