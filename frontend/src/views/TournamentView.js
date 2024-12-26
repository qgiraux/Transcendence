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
    TRequest.request("GET", "/api/tournament/list/")
      .then((result) => {
        this.userList = result;
        this._refreshTournamentsList();
      })
      .catch((error) => {
        Alert.errorMessage("Error", error.message);
      });

    this._setHtml();
  }


  async _refreshTournamentsList() {
    try {
      const tournamentsList = await TRequest.request(
        "GET",
        "/api/tournament/list/"
      );
      this.tournamentsList = tournamentsList.tournaments;
      this.displayTournamentsList(this.tournamentsList);
    } catch (error) {
      Alert.errorMessage(
        "get Tournaments list : something went wrong",
        error.message
      );
    }
  }

  async displayTournamentsList(tournamentsList) {
    const tournamentsContainer = document.querySelector("#tournaments-container");
    tournamentsContainer.innerHTML = "";
    try {
      tournamentsList.forEach((tournament) => {
        this.addTournamentCard(tournament);
      });
    } catch (error) {
      console.log(error.message);
      Alert.errorMessage("displayTournamentsList error", error.message);
    }
  }

  async addTournamentCard(tournament) {
    const tournamentsContainer = document.querySelector("#tournaments-container");
    const div = document.createElement("div");
    div.classList.add("col-md-4");
    div.classList.add("col-lg-3");
    div.style.maxWidth = "200px";

    try {
        // Fetch tournament details
        const response = await TRequest.request("GET", `/api/tournament/details/${tournament}`);
        const det = response;
        const playerList = det.players;
        const isPlayerInTournament = playerList.includes(Application.getUserInfos().userId);

        // Shorten the tournament name if it's too long
        const tournamentName = det["tournament name"].length > 14 ? det["tournament name"].substring(0, 11) + '...' : det["tournament name"];

        // Create the HTML content for the card
        div.innerHTML = `
        <div class="col-md-4 col-lg-3" style="width: 180px;">
            <div class="card shadow border-secondary p-2 fixed-width-card text-white"
                style="background-color: #303030;">
                <div class="card-body">
                    <h7 class="card-title">${tournamentName}</h7>
                    <p class="card-text">${playerList.length} / ${det.size}</p>
                    <button 
                        class="btn btn-primary" 
                        id="join-${tournament}" 
                        data-tournament="${tournament}"
                        ${isPlayerInTournament ? "disabled" : ""}
                        style="${isPlayerInTournament ? "background-color: grey; cursor: not-allowed;" : ""}">
                        ${isPlayerInTournament ? "Already Joined" : "Join Tournament"}
                    </button>
                </div>
            </div>
        </div>`;

        // Add click event listener to the join button only if not disabled
        const joinButton = div.querySelector(`#join-${tournament}`);
        if (!isPlayerInTournament) {
            joinButton.addEventListener("click", async () => {
                const form = { name: tournament }; // Form data containing tournament name
                try {
                    // Send a POST request to join the tournament
                    const postResponse = await TRequest.request("POST", "/api/tournament/join/", form);

                    // Update the button UI after successfully joining
                    joinButton.disabled = true;
                    joinButton.innerText = 'Joined';
                    joinButton.style.backgroundColor = "grey";
                    joinButton.style.cursor = "not-allowed";
                } catch (error) {
                    console.error('Error joining tournament:', error);
                    Alert.error('Failed to join the tournament. Please try again.');
                }
            });
        }
    } catch (error) {
        console.error("Error fetching tournament details:", error);
        div.innerHTML = `
        <div class="col-md-4 col-lg-3" style="width: 180px;">
            <div class="card shadow border-secondary p-2 fixed-width-card text-white"
                style="background-color: #303030;">
                <div class="card-body">
                    <h7 class="card-title">${tournament}</h7>
                    <p class="card-text text-danger">Details unavailable</p>
                </div>
            </div>
        </div>`;
    }

    tournamentsContainer.appendChild(div);
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
			<div class="col-12">
				<h1 class="text-white display-1">Tournaments</h1>
			</div>
		</div>
		<div class="row g-2  border border-secondary p-2 rounded" id="tournaments-container">
		</div>
					`;
    }
  }
}

export default TournamentsView;
