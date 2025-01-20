if (Application.gameSocket) {
      console.log("WebSocket connection already established.");
      try {
        Application.gameSocket.onmessage = (event) => {
          // Parse the incoming JSON
          console.log("WebSocket message received:", event.data);
          const data = JSON.parse(event.data);
          const sender = data.sender || 0; // Default if field missing
          const group = data.group || "No group"; // Default if field missing
          const message = data.message || "No message content"; // Default if field missing
          const type = data.type || "chat"; // Default if field missing
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
    } else {
      console.error("WebSocket connection not established.");
    }
  }