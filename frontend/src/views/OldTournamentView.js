import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";

class TournamentsView extends AbstractView {
  tournamentsList = [];

  constructor(params) {
    super(params);
    this.onStart();
  }

  onStart() {
    this._setTitle("Tournaments");
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }

    Avatar.getUUid();
    this._fetchTournaments();
    this._setHtml();
    this.createNewTournamentForm();
    this._setupNewTournamentListener();
  }

  async _fetchTournaments() {
    try {
      const response = await TRequest.request("GET", "/api/tournament/list/");
      this.tournamentsList = response.tournaments || [];
      this.displayTournamentsList(this.tournamentsList);
    } catch (error) {
      Alert.errorMessage("Error fetching tournaments", error.message);
    }
  }

  async displayTournamentsList(tournamentsList) {
    const tournamentsContainer = document.querySelector("#tournaments-container");
    tournamentsContainer.innerHTML = "";
    try {
      for (const tournament of tournamentsList) {
        await this.addTournamentCard(tournament);
      }
    } catch (error) {
      Alert.errorMessage("Error displaying tournaments", error.message);
    }
  }

  async addTournamentCard(tournament) {
    const tournamentsContainer = document.querySelector("#tournaments-container");
    const div = document.createElement("div");
    div.className = "col-md-4 col-lg-3";
    div.style.maxWidth = "200px";
  
    try {
      // Fetch tournament details
      const details = await TRequest.request("GET", `/api/tournament/details/${tournament}`);
      const { "tournament name": name, players, size } = details;
  
      // Check if the current user is part of the tournament
      const userId = Application.getUserInfos().userId;
      const isPlayerInTournament = players.includes(userId);
  
      // Fetch the friend list
      const friendList = await this._refreshFriendsList();
  
      // Set the card content
      div.innerHTML = `
        <div class="card shadow border-secondary p-2 text-white" style="background-color: #303030;">
          <div class="card-body">
            <h7 class="card-title">${name.length > 14 ? name.substring(0, 11) + '...' : name}</h7>
            <p class="card-text">${players.length} / ${size}</p>
            <button 
              class="btn btn-primary" 
              id="join-${tournament}" 
              data-tournament="${tournament}"
              ${isPlayerInTournament ? "disabled" : ""}
              style="${isPlayerInTournament ? "background-color: grey; cursor: not-allowed;" : ""}">
              ${isPlayerInTournament ? "Already Joined" : "Join Tournament"}
            </button>
          </div>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              Invite a friend
            </button>
            <ul class="dropdown-menu">
              ${friendList
                .map(friendId => `<li><a class="dropdown-item" href="#" data-friend-id="${friendId}">Friend ${friendId}</a></li>`)
                .join('')}
            </ul>
          </div>
        </div>
      `;
  
      // Add event listener for the "Join Tournament" button
      const joinButton = div.querySelector(`#join-${tournament}`);
      if (!isPlayerInTournament) {
        joinButton.addEventListener("click", async () => {
          try {
            // Join the tournament
            await TRequest.request("POST", "/api/tournament/join/", { name: tournament });
            joinButton.disabled = true;
            joinButton.innerText = "Joined";
            joinButton.style.backgroundColor = "grey";
            joinButton.style.cursor = "not-allowed";
          } catch (error) {
            Alert.errorMessage("Error joining tournament", error.message);
          }
        });
      }
  
      // Add event listeners for friend invitation dropdown
      const dropdownItems = div.querySelectorAll(".dropdown-item");
      dropdownItems.forEach(item => {
        item.addEventListener("click", async (event) => {
          event.preventDefault();
          const friendId = item.getAttribute("data-friend-id");
          try {
            // Send the friend invitation
            await TRequest.request("POST", "/api/tournament/invite/", {
              friend_id: friendId,
              tournament_name: tournament,
            });
            Alert.successMessage("Friend Invited", `Successfully invited friend ${friendId}`);
          } catch (error) {
            Alert.errorMessage("Error inviting friend", error.message);
          }
        });
      });
  
      tournamentsContainer.appendChild(div);
    } catch (error) {
      console.error("Error fetching tournament details:", error);
      div.innerHTML = `
        <div class="text-danger">Failed to load tournament details</div>
      `;
      tournamentsContainer.appendChild(div);
    }
  }
  

  async _refreshFriendsList() {
    try {
      const response = await TRequest.request("GET", "/api/friends/friendslist/");
  
      // Ensure the response contains a "friends" array
      if (!response || !Array.isArray(response.friends)) {
        console.error("Invalid friends list response:", response);
        throw new Error("Friends list is not in the expected format.");
      }
  
      // Extract the friends array and return it
      return response.friends;
    } catch (error) {
      Alert.errorMessage("Error fetching friends list", error.message);
      return []; // Return an empty array if there's an error
    }
  }
  

  createNewTournamentForm() {
    const tournamentsContainer = document.querySelector("#new-tournament-container");
    tournamentsContainer.innerHTML = `
      <h5 class="text-white">Create Tournament</h5>
      <form id="create-tournament-form" class="d-flex align-items-center">
        <div class="form-group mr-2">
          <label for="tournament-name" class="text-white">Tournament Name</label>
          <input type="text" class="form-control" id="tournament-name" placeholder="Enter tournament name" required>
        </div>
        <div class="form-group mr-2">
          <label for="tournament-size" class="text-white">Tournament Size</label>
          <select class="form-control" id="tournament-size" required>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary mt-4">Create</button>
      </form>
    `;
  }

  _setupNewTournamentListener() {
    const form = document.querySelector("#create-tournament-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const tournamentName = document.querySelector("#tournament-name").value;
      const tournamentSize = document.querySelector("#tournament-size").value;

      if (!/^[a-zA-Z0-9]{3,30}$/.test(tournamentName)) {
        Alert.errorMessage("Invalid tournament name", "Tournament name must be 3-30 characters long and contain only letters and numbers.");
        return;
      }

      try {
        await TRequest.request("POST", "/api/tournament/create/", { name: tournamentName, size: tournamentSize });
        this._fetchTournaments();
      } catch (error) {
        Alert.errorMessage("Error creating tournament", error.message);
      }
    });
  }

  _setHtml() {
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <h1 class="text-white display-1">Tournaments</h1>
          </div>
        </div>
        <div class="row">
          <div class="col-12 border border-secondary p-2 rounded" id="new-tournament-container"></div>
        </div>
        <div class="row g-2 border border-secondary p-2 rounded" id="tournaments-container"></div>
      `;
    }
  }
}

export default TournamentsView;
