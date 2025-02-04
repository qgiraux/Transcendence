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
    await Application.localization.loadTranslations();
    await Application.setLanguage(Application.lang);
    this.domText.Title = await Application.localization.t(
      "tournament.create.txt"
    );
    this.domText.createTournamentTxt = await Application.localization.t(
      "tournament.create.txt"
    );
    this.domText.tournamentNameTxt = await Application.localization.t(
      "tournament.create.name.txt"
    );
    this.domText.tournamentNameEnter = await Application.localization.t(
      "tournament.create.name.enter"
    );
    this.domText.tournamentSizeTxt = await Application.localization.t(
      "tournament.create.size.txt"
    );
    this.domText.createTournamentAction = await Application.localization.t(
      "tournament.create.action.txt"
    );
    this.messages.fetchTournamentsErr = await Application.localization.t(
      "tournament.create.errors.fetchTournaments"
    );
    this.messages.displayTournamentsErr = await Application.localization.t(
      "tournament.create.errors.displayTournaments"
    );
    this.messages.joinTournamentErr = await Application.localization.t(
      "tournament.create.errors.joinTournament"
    );
    this.messages.createTournamentErr = await Application.localization.t(
      "tournament.create.errors.createTournament"
    );
    this.messages.invalidName = await Application.localization.t(
      "tournament.create.errors.invalidName"
    );
    this.messages.tourNameRequirements = await Application.localization.t(
      "tournament.create.errors.tourNameRequirements"
    );
    this.messages.inviteFriendTitle = await Application.localization.t(
      "tournament.invite.title"
    );
    this.messages.inviteFriendSuccess = await Application.localization.t(
      "tournament.invite.success"
    );
    this.messages.inviteFriendFailure = await Application.localization.t(
      "tournament.invite.failure"
    );
    this.messages.alreadyJoined = await Application.localization.t(
      "tournament.card.alreadyJoined"
    );
    this.messages.tournamentFull = await Application.localization.t(
      "tournament.card.tournamentFull"
    );
    this.messages.joinTournament = await Application.localization.t(
      "tournament.card.joinTournament"
    );
    this.messages.deleteTournament = await Application.localization.t(
      "tournament.card.deleteTournament"
    );
  }

  listenForLanguageChange() {
    const languageSelector = document.getElementById(
      "language-selector-container"
    );
    if (languageSelector) {
      this.addEventListener(languageSelector, "change", async (event) => {
        const selectedLanguage = event.target.value;
        console.log(selectedLanguage);
        await Application.setLanguage(selectedLanguage);
        await this.loadMessages();
        await Application.applyTranslations();
        // this._setHtml();
        // Router.reroute("/tournaments");
      });
    }
  }
  onStart() {
    this._setTitle("Tournaments");
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }
    //internal state variables
    this.panel_status = 0; // toggle for the panel open/in progress/ finished
    this.joined = false; // did the user already joined a tournament

    this._setHtml();

    TRequest.request("GET", "/api/friends/friendslist/")
      .then((result) => {
        return result["friends"];
      })
      .then((friends) => {
        return this.fetchFriendsDetails(friends);
      })
      .then((details) => {
        this.friendsDetails = details;
      })
      .then(() => {
        return TRequest.request("GET", "/api/tournament/list/");
      })
      .then((result) => {
        return this.fetchTournamentDetails(result["tournaments"]);
      })
      .then((tournaments) => {
        this.tournaments = tournaments;
      })
      .then(() => {
        this.refreshPanel();
        Avatar.refreshAvatars();
      })
      .catch((error) => {
        Alert.errorMessage(
          `Something went wrong : ${error}`,
          `Please try again later `
        );
      });

    //                  Event listeners
    // state panel
    const btnStatus0 = document.querySelector("#status-0");
    const btnStatus1 = document.querySelector("#status-1");
    const btnStatus2 = document.querySelector("#status-2");
    this.addEventListener(btnStatus0, "click", this.switchStatus.bind(this));
    this.addEventListener(btnStatus1, "click", this.switchStatus.bind(this));
    this.addEventListener(btnStatus2, "click", this.switchStatus.bind(this));

    //join tournament event delegation
    const scrollablePanel = document.querySelector("#scrollable-panel");
    this.addEventListener(
      scrollablePanel,
      "click",
      this.joinTournamentHandler.bind(this)
    );
  }

  /*

  Event listeners

  */

  switchStatus(event) {
    const oldStatus = this.panel_status;
    const newStatus = Number(event.target.dataset.status);
    this.panel_status = newStatus;
    const btnStatusOld = document.querySelector(`#status-${oldStatus}`);
    const btnStatusNew = document.querySelector(`#status-${newStatus}`);
    btnStatusOld.classList.remove("active");
    btnStatusNew.classList.add("active");
    this.refreshPanel();
    Avatar.refreshAvatars();
  }

  async joinTournamentHandler(event) {
    if (event.target.classList.contains("join-tournament-btn")) {
      const tournamentName = event.target.getAttribute("data-tournament");
      console.log("trying to join", tournamentName);
      try {
        const req = await TRequest.request("POST", "/api/tournament/join/", {
          name: tournamentName,
        });
        Alert.successMessage(
          "Tournament",
          `Successfully joined tournament ${tournamentName}`
        );
        Application.joinedTournament = tournamentName;
      } catch (error) {
        Alert.errorMessage("Tournament", "Could not join tournament");
      }
      Router.reroute("/tournaments");
    }
  }

  /*
Request API function
*/

  async fetchTournamentDetails(names) {
    const details = await Promise.all(
      names.map(async (name) => {
        try {
          const response = await TRequest.request(
            "GET",
            `/api/tournament/details/${name}`
          );
          return response;
        } catch (error) {
          return null;
        }
      })
    );
    return details;
  }

  async fetchFriendsDetails(friends) {
    const details = await Promise.all(
      friends.map(async (friend) => {
        try {
          const response = await TRequest.request(
            "GET",
            `/api/users/userinfo/${friend}`
          );
          return response;
        } catch (error) {
          return null;
        }
      })
    );
    return details;
  }

  /*

  	View state handler

*/

  refreshPanel() {
    const panel = document.getElementById("scrollable-panel");
    if (!panel) return;
    panel.innerHTML = "";
    const selectedTournaments = this.tournaments.filter((tournament) => {
      return tournament["status"] === this.panel_status;
    });
    switch (this.panel_status) {
      case 0:
        selectedTournaments.forEach((tournament) => {
          if (
            tournament["players"].includes(Application.getUserInfos().userId)
          ) {
            this.joined = true;
          }
        });
        if (!this.joined)
          panel.appendChild(this.createNewTournamentHeaderPanel());
        selectedTournaments.forEach((tournament) => {
          panel.appendChild(this.createOpenTournamentCard(tournament));
        });
        break;
      case 1:
        selectedTournaments.forEach((tournament) => {
          panel.appendChild(this.createTournamentCard(tournament));
        });
        break;
      case 2:
        selectedTournaments.forEach((tournament) => {
          panel.appendChild(this.createTournamentCard(tournament));
        });
        break;
    }
  }

  /*
  HTML Elements creation helpers fucntcions :

*/

  getIdfromTournament(tournament, round, index) {
    if (!tournament["rounds"][round]) return 0;
    if (tournament["rounds"][round].length <= index) return 0;
    return tournament["rounds"][round][index];
  }

  getProfileLinkformId(id) {
    if (id === 0) return "";
    return `/profile/${id}`;
  }

  createAvatarElementFromId(id, size, winner) {
    const img = document.createElement("img");
    img.classList.add("rounded", "rounded-circle");
    if (winner) {
      img.classList.add(
        "rounded",
        "rounded-circle",
        "border",
        "border-warning"
      );
    }
    img.width = size;
    img.height = size;
    if (id !== 0) {
      img.src = Avatar.url(id);
      img.dataset.avatar = id;
      const link = document.createElement("a");
      link.dataset.link = 1;
      link.href = this.getProfileLinkformId(id);
      link.appendChild(img);
      return link;
    } else {
      img.src = "/img/question_mark_icon.png";
      return img;
    }
  }

  createNewTournamentHeaderPanel() {
    const link = document.createElement("a");
    link.href = "/create-tournament";
    link.text = "Create your own!";
    link.dataset.link = 1;
    link.classList.add("text-white", "text-center");
    const header = document.createElement("div");
    header.classList.add("row", "p-2", "w-75");
    header.innerHTML = `<h4 class="text-white text-center">Can't find a tournament you like?</h4>`;
    header.appendChild(link);
    return header;
  }

  createOpenTournamentCard(tournament) {
    const card = document.createElement("div");
    const freeSpots = tournament["size"] - tournament["players"].length;
    card.classList.add(
      "tournament-card",
      "w-75",
      "text-white",
      "border",
      "p-3"
    );
    card.dataset.tournament = tournament["tournament name"];
    card.innerHTML = `
	<div class="row d-flex justify-content-center">
		<div class="row d-flex justify-self-center">
			<div class="col">
				<h4 class="text-white">${tournament["tournament name"]}
				<span class="badge bg-success joined-badge" style="display: none;">Joined</span>
				</h4>
				<h4 class="text-secondary" id="size">${tournament["size"]} players</h4>
				<h5 class="text-secondary " id="spot-left">${freeSpots} spot left</h5>
				<div class="row d-flex justify-content-center justify-self-center mt-2" id="action"></div>
			</div>
		<div class="players-avatars col d-flex flex-column justify-content-center align-items-center gap-2 p-1 border  "
			>
			<div class="d-flex flex-row gap-2  align-self-center" id="row1">
			</div>
			<div class="d-flex flex-row gap-2 align-self-center" id="row2">
			</div>
		</div>
	</div>
	`;

    const row1Div = card.querySelector("#row1");
    const row2Div = card.querySelector("#row2");
    let i = 0;
    for (; i < 4; i++) {
      if (i < tournament["players"].length) {
        row1Div.appendChild(
          this.createAvatarElementFromId(tournament["players"][i], 60, false)
        );
      } else if (i < tournament["size"]) {
        row1Div.appendChild(this.createAvatarElementFromId(0, 60, false));
      }
    }
    for (; i < tournament["size"]; i++) {
      if (i < tournament["players"].length) {
        row2Div.appendChild(
          this.createAvatarElementFromId(tournament["players"][i], 60, false)
        );
      } else {
        row2Div.appendChild(this.createAvatarElementFromId(0, 60, false));
      }
    }
    const actionDiv = card.querySelector("#action");
    if (!this.joined) {
      // add the joined button if no tournament has been joined yet
      actionDiv.innerHTML = `<button type="button" class="btn btn-primary w-50
	  justify-self-center join-tournament-btn" data-tournament="${tournament["tournament name"]}">Join</button>`;
    } else if (
      tournament["players"].includes(Application.getUserInfos().userId)
    ) {
      const badge = card.querySelector(".joined-badge");
      if (badge) {
        badge.style.display = "inline-block";
      }
      actionDiv.innerHTML = `<div class="dropdown">
  <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    Invite a friend
  </button>
  			<div class="dropdown-menu" aria-labelledby="dropdownMenuButton"></div>
	</div>`;
      const dropdownMenu = actionDiv.querySelector(".dropdown-menu");
      this.friendsDetails.forEach((friend) => {
        dropdownMenu.appendChild(
          this.createDropdownFriendElement(
            tournament["tournament name"],
            friend.id,
            friend.username,
            friend.nickname
          )
        );
      });
    }
    return card;
  }

  createTournamentCard(tournament) {
    let roundNumber = tournament["size"];
    //create the tournament card div
    const card = document.createElement("div");
    card.classList.add(
      "tournament-card",
      "w-75",
      "text-white",
      "border",
      "p-3"
    );
    card.innerHTML = `
				<div class="row mt-1 d-flex  justify-content-center align-items-center mx-auto">
  				<h4>${tournament["tournament name"]}</h4>
				<div class="row d-flex mx-auto justify-content-center align-items-center p-1" id="rounds-container"></div>
				`;
    const roundsContainer = card.querySelector("#rounds-container");

    for (; roundNumber >= 1; roundNumber = roundNumber / 2) {
      let roundDiv = document.createElement("div");
      roundDiv.classList.add(
        "col",
        "d-flex",
        "flex-column",
        "justify-content-center"
      );
      roundDiv.id = `round-${roundNumber}`;
      roundDiv = this.populateRound(tournament, roundDiv, roundNumber);
      roundsContainer.appendChild(roundDiv);
    }

    return card;
  }

  createRoundMatchHTML(tournament, round, indexPlayerOne, indexPlayertwo) {
    const match = document.createElement("div");
    match.classList.add(
      "match",
      "d-flex",
      "justify-content-center",
      "align-items-center",
      "mb-2",
      "p-1",
      "border",
      "gap-1"
    );
    const idPlayerOne = this.getIdfromTournament(
      tournament,
      round,
      indexPlayerOne
    );
    const idPlayerTwo = this.getIdfromTournament(
      tournament,
      round,
      indexPlayertwo
    );
    match.appendChild(this.createAvatarElementFromId(idPlayerOne, 50, false));
    match.appendChild(this.createAvatarElementFromId(idPlayerTwo, 50, false));
    return match;
  }

  createDropdownFriendElement(
    tournamentName,
    friendId,
    friendUserName,
    friendNickName
  ) {
    const div = document.createElement("div");
    div.dataset.id = friendId;
    div.dataset.tournament = tournamentName;
    div.classList.add(
      "dropdown-item",
      "d-flex",
      "flex-row",
      "w-100",
      "w-0",
      "bg-warning"
    );
    div.innerHTML = `
			<img data-avatar="${friendId}" src="${Avatar.url(
      friendId
    )}" alt="${friendUserName}" width="30" height="30" class="rounded-circle"><h5>${friendNickName}</h5>`;
    return div;
  }

  populateRound(tournament, roundDiv, roundNumber) {
    if (roundNumber == 1) {
      roundDiv.appendChild(
        this.createAvatarElementFromId(
          this.getIdfromTournament(tournament, "1", 0),
          90,
          true
        )
      );
    }
    let secondPlayer = roundNumber - 1;
    for (secondPlayer = 1; secondPlayer < roundNumber; secondPlayer += 2) {
      roundDiv.appendChild(
        this.createRoundMatchHTML(
          tournament,
          String(roundNumber),
          secondPlayer - 1,
          secondPlayer
        )
      );
    }
    return roundDiv;
  }

  /// SET THE LAYOUT FOR THE VIEW

  _setHtml() {
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `
			<div class=" mx-auto" style="max-width: 700px;">
				<h1 class="text-white text-center mb-5">Tournaments</h1>

				<div class="row">
					<div class="btn-group mx-auto align-items-center">
						<button id="status-0" data-status="0" class="btn btn-primary active" aria-current="page">Open
							tournaments</button>
						<button id="status-1" data-status="1" class="btn btn-primary">Tournaments in progress</button>
						<button id="status-2" data-status="2" class="btn btn-primary">Finished
							tournaments</button>
					</div>

				</div>
				<div class="row  mt-3 p-3 gap-3 justify-content-center align-items-center  border  overflow-auto" id="scrollable-panel">
						</div>
			</div>
				</div>
			</div>


      `;
    }
  }
}

export default TournamentsView;
