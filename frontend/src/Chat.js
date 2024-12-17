import Application from "./Application.js";

class Chat {
  constructor() {
    throw new Error("This class cannot be instantiated");
  }

  static DisplayNewMessage(message, sender) {
    const chatBox = document.querySelector("#chat-messages");
    const newMsg = document.createElement('div');
    newMsg.textContent = sender + ': ' + message;
    chatBox.appendChild(newMsg);

  }
}

export default Chat;