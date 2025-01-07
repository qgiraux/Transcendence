// script.js
import Application from "./Application.js";

// Elements
const chatBtn = document.getElementById('chat-btn');
const chatPopup = document.getElementById('chat-popup');
const closeChat = document.getElementById('close-chat');
const sendBtn = document.getElementById('send-btn');
const chatInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chat-messages');
const chatGroup = document.getElementById('groupInput');

// Show the chat popup
chatBtn.addEventListener('click', () => {
    chatPopup.style.display = 'flex';
    chatBtn.style.display = 'none';
});

// Close the chat popup
closeChat.addEventListener('click', () => {
    chatPopup.style.display = 'none';
    chatBtn.style.display = 'block';
});

// if (sendBtn !== null) {
    const sendMessage = () => {
        console.log('Send button clicked');
        const group = chatGroup.value || 'global_chat';
        const body = {
            message: chatInput.value,
            group: group,
            type: 'chat',
            sender: Application.getUserInfos().userId
        };
        Application.mainSocket.send(JSON.stringify(body));
        chatInput.value = '';
    };

    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
// }