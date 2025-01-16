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
    this.domText = {};
    this.messages = {};
    this.init();
  }

  async init() {
    await this.loadMessages();
    this.onStart();
  }

  async loadMessages() {
    await Application.loadLocalization();
    await Application.setLanguage("fr-fr"); // for testing purposes
    // console.log("OK");

    // Textes pour la création du tournoi
    this.domText.Title = await Application.localization.t("tournament.create.txt");
    this.domText.createTournamentTxt = await Application.localization.t("tournament.create.txt");
    this.domText.tournamentNameTxt = await Application.localization.t("tournament.create.name.txt");
    this.domText.tournamentNameEnter = await Application.localization.t("tournament.create.name.enter");
    this.domText.tournamentSizeTxt = await Application.localization.t("tournament.create.size.txt");
    this.domText.createTournamentAction = await Application.localization.t("tournament.create.action.txt");

    // Messages d'erreur pour la création du tournoi
    this.messages.fetchTournamentsErr = await Application.localization.t("tournament.create.errors.fetchTournaments");
    this.messages.displayTournamentsErr = await Application.localization.t("tournament.create.errors.displayTournaments");
    this.messages.joinTournamentErr = await Application.localization.t("tournament.create.errors.joinTournament");
    this.messages.createTournamentErr = await Application.localization.t("tournament.create.errors.createTournament");
    this.messages.invalidName = await Application.localization.t("tournament.create.errors.invalidName");
    this.messages.tourNameRequirements = await Application.localization.t("tournament.create.errors.tourNameRequirements");

    // Messages d'invitation
    this.messages.inviteFriendTitle = await Application.localization.t("tournament.invite.title");
    this.messages.inviteFriendSuccess = await Application.localization.t("tournament.invite.success");
    this.messages.inviteFriendFailure = await Application.localization.t("tournament.invite.failure");

    //card
    this.messages.alreadyJoined = await Application.localization.t("tournament.card.alreadyJoined");
    this.messages.tournamentFull = await Application.localization.t("tournament.card.tournamentFull");
    this.messages.joinTournament = await Application.localization.t("tournament.card.joinTournament");
    this.messages.deleteTournament = await Application.localization.t("tournament.card.deleteTournament");


    // this.domText.Title = await Application.localization.t("titles.tournament");
    // this.domText.createTournamentTxt = "Create tournament";
    // this.domText.tournamentNameTxt = "Tournament name";
    // this.domText.tournamentNameEnter = "Enter tournament name";
    // this.domText.tournamentSizeTxt = "Number of players";
    // this.domText.createTournamentAction = "Create";
    // this.messages.fetchTournamentsErr = "Error fetching tournaments";
    // this.messages.displayTournamentsErr = "Error displaying tournaments";
    // this.messages.joinTournamentErr = "Error joining tournament";
    // this.messages.createTournamentErr = "Error creating tournament";
    // this.messages.inviteFriendTitle = "Friend Invited";
    // this.messages.inviteFriendSuccess = "Successfully invited friend";
    // this.messages.inviteFriendFailure = "Error inviting friend";
    // this.messages.invalidName = "Invalid tournament name";
    // this.messages.tourNameRequirements = "Tournament name must be 3-30 characters long and contain only letters and numbers.";
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
      // Alert.errorMessage("Error fetching tournaments", error.message);
      Alert.errorMessage(this.messages.fetchTournamentsErr, error.message);

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
      // Alert.errorMessage("Error displaying tournaments", error.message);
      Alert.errorMessage(this.messages.displayTournamentsErr, error.message);

    }
  }

  async _refresh_cards(tournament) {
    const tournamentsContainer = document.querySelector("#tournaments-container");
    tournamentsContainer.innerHTML = "";
    try {
      await this._fetchTournaments()
    } catch (error) {
      // Alert.errorMessage("Error displaying tournaments", error.message);
      Alert.errorMessage(this.messages.displayTournamentsErr, error.message);

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
      await this.loadMessages();
      
      const userId = Application.getUserInfos().userId;
      const isPlayerInTournament = players.includes(userId);
      const isTournamentFull = players.length >= size;
  
      // Fetch the friend list
      const friendIdList = await this._refreshFriendsList();
      const friendList = await Promise.all(
        friendIdList.map(async (friendID) => {
              try {
                const user = await TRequest.request("GET", `/api/users/userinfo/${friendID}`);
                return user.username; // Return the username for the friend
              } catch (err) {
                console.error("Failed to fetch user info:", err);
                return null; // Return null for failed requests to avoid breaking Promise.all
              }
            })
          );



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
              ${isPlayerInTournament || isTournamentFull ? "disabled" : ""}
              style="${isPlayerInTournament || isTournamentFull ? "background-color: grey; cursor: not-allowed;" : ""}">
              ${isPlayerInTournament ? this.messages.alreadyJoined : isTournamentFull ? this.messages.tournamentFull : this.messages.joinTournament}
            </button>
            <button 
              class="btn btn-secondary" 
              id="delete-${tournament}" 
              data-tournament="${tournament}"
              ${!isPlayerInTournament ? "disabled" : ""}
              style="${!isPlayerInTournament ? "background-color: grey; cursor: not-allowed;" : ""}">
              ${this.messages.deleteTournament}
            </button>
          </div>

          <div class="btn-group">
            <button class="btn btn-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              Invite a friend
            </button>
            <ul class="dropdown-menu">
              ${friendIdList
                .map((friendId, index) => {
                  const friendName = friendList[index]; // Get the corresponding username
                  if (friendName) { // Ensure the username is not null
                    return `<li><a class="dropdown-item" href="#" data-friend-id="${friendId}">${friendName}</a></li>`;
                  } else {
                    return ''; // Skip if username is null
                  }
                })
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
            // Alert.errorMessage("Error joining tournament", error.message);
            Alert.errorMessage(this.messages.joinTournamentErr, error.message);

          }
        });
      }

      // Add event listener for the "Join Tournament" button
      const deleteButton = div.querySelector(`#delete-${tournament}`);
      if (isPlayerInTournament) {
        deleteButton.addEventListener("click", async () => {
          try {
            // Join the tournament
            await TRequest.request("DELETE", "/api/tournament/delete/", { name: tournament });
            await this._refresh_cards(tournament);
            // joinButton.disabled = true;
            // joinButton.innerText = "Joined";
            // joinButton.style.backgroundColor = "grey";
            // joinButton.style.cursor = "not-allowed";
          } catch (error) {
            // Alert.errorMessage("Error joining tournament", error.message);
            Alert.errorMessage(this.messages.joinTournamentErr, error.message);
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
            const username = await TRequest.request("GET", `/api/users/userinfo/${friendId}`);
            console.log(friendList[friendId])
            // Alert.successMessage("Friend Invited", `Successfully invited friend ${username.username}`);
            Alert.successMessage(this.messages.inviteFriendTitle, `${this.messages.inviteFriendSuccess} ${username.username}`);
          } catch (error) {
            Alert.errorMessage(this.messages.inviteFriendFailure, error.message);
            // Alert.errorMessage("Error inviting friend", error.message);
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
        throw new Error("Friends list is not in the expected format."); //BACK ?>
      }
      return response.friends;
    } catch (error) {
      // Alert.errorMessage("Error fetching tournament", error.message);
      Alert.errorMessage(this.messages.fetchTournamentsErr, error.message);
      return []; // Return an empty array if there's an error
    }
  }
  
  

  createNewTournamentForm() {
    const tournamentsContainer = document.querySelector("#new-tournament-container");
    tournamentsContainer.innerHTML = `
      <h5 class="text-white">${this.domText.createTournamentTxt}</h5>
      <form id="create-tournament-form" class="d-flex align-items-center">
        <div class="form-group mr-2">
          <label for="tournament-name" class="text-white">${this.domText.tournamentNameTxt}</label>
          <input type="text" class="form-control" id="tournament-name" placeholder="${this.domText.tournamentNameEnter}" required>
        </div>
        <div class="form-group mr-2">
          <label for="tournament-size" class="text-white">${this.domText.tournamentSizeTxt}</label>
          <select class="form-control" id="tournament-size" required>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary mt-4">${this.domText.createTournamentAction}</button>
      </form>
    `;
  }

  async _setupNewTournamentListener() {
    const form = document.querySelector("#create-tournament-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const tournamentName = document.querySelector("#tournament-name").value;
      const tournamentSize = document.querySelector("#tournament-size").value;

      if (!/^[a-zA-Z0-9]{3,30}$/.test(tournamentName)) {
        // Alert.errorMessage("Invalid tournament name", "Tournament name must be 3-30 characters long and contain only letters and numbers.");
        Alert.errorMessage(this.messages.invalidName, this.messages.tourNameRequirements);

        return;
      }
      try {
        await TRequest.request("POST", "/api/tournament/create/", { name: tournamentName, size: tournamentSize });
        this._fetchTournaments();
      } catch (error) {
        Alert.errorMessage(this.messages.createTournamentErr, error.message);
      }
    });
  }

  _setHtml() {
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <h1 class="text-white display-1">${this.domText.Title}</h1>
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
