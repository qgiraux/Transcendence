import Application from "./Application.js";
import TRequest from "./TRequest.js"; // Assuming TRequest is defined in TRequest.js
import Router from "./Router.js";

class Chat {
  constructor() {
    throw new Error("This class cannot be instantiated");
  }

  static DisplayNewMessage(message, sender) {
    const chatBox = document.querySelector("#chat-messages");
    const newMsg = document.createElement('div');
    TRequest.request("GET", `/api/users/userinfo/${sender}`).then(nickname => {
      // Create a clickable username link
      const usernameLink = document.createElement('a');
      usernameLink.textContent = nickname.nickname;
      usernameLink.href = "#"; // Prevent default link behavior
      usernameLink.className = 'hover-tooltip'; // Add a class for the tooltip styling
      usernameLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the anchor from navigating
        Router.reroute(`/profile/${sender}`);
      });

      // Create the tooltip
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip'; // Add a class for tooltip styling

      // Add the image to the tooltip
      const tooltipImage = document.createElement('img');
      tooltipImage.src = `/img/avatar_placeholder.jpg`; // Replace with the actual path to your images
      tooltipImage.alt = `${nickname.nickname}'s profile picture`;
      tooltipImage.style.width = '50px'; // Set the desired width
      tooltipImage.style.height = '50px'; // Set the desired height
      tooltipImage.style.borderRadius = '50%'; // Optional: Makes it circular
      tooltip.appendChild(tooltipImage);

      // Add the text to the tooltip
      const tooltipText = document.createElement('span');
      tooltipText.textContent = nickname.username;
      tooltip.appendChild(tooltipText);

      // Append the tooltip to the username link
      usernameLink.appendChild(tooltip);

      // Append the username link and message text to newMsg
      newMsg.appendChild(usernameLink);
      newMsg.appendChild(document.createTextNode(`: ${message}`));

      // Append the new message to the chat box
      chatBox.appendChild(newMsg);
      // Scroll the chat box to the bottom
      chatBox.scrollTop = chatBox.scrollHeight;
    }).catch(err => {console.error("Failed to fetch user info:", err);});
    

  }
}

export default Chat;