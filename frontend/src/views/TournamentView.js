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
    this.ongoingEvent = false;
    this.init();
  }

  async init() {
    await this.loadMessages();
    Application.toggleLangSelectorShow();
    this.onStart();
  }

  async loadMessages() {
    // await Application.localization.loadTranslations();
    await Application.setLanguage(Application.lang);
    this.domText.title = await Application.localization.t("titles.tournament");
    this.domText.createTournamentTxt = await Application.localization.t(
      "tournament.create.txt"
    );
    this.domText.cantFind = await Application.localization.t(
      "tournament.create.cantFind"
    );
    this.domText.yourOwn = await Application.localization.t(
      "tournament.create.yourOwn"
    );
    this.domText.tournamentNameTxt = await Application.localization.t(
      "tournament.create.name.txt"
    );
    this.domText.tournamentsInProgress = await Application.localization.t(
      "tournament.tab.inProgress"
    );
    this.domText.openTournaments = await Application.localization.t(
      "tournament.tab.open"
    );
    this.domText.finishedTournaments = await Application.localization.t(
      "tournament.tab.finished"
    );
    this.domText.inviteFriend = await Application.localization.t(
      "tournament.invite.friend"
    );
    this.domText.joined = await Application.localization.t(
      "tournament.join.true"
    );
    this.domText.playerTxt = await Application.localization.t(
      "tournament.card.players"
    );
    this.domText.spotsTxt = await Application.localization.t(
      "tournament.card.spots"
    );
    this.domText.joinTournament = await Application.localization.t(
      "tournament.card.joinTournament"
    );
    this.domText.deleteTournament = await Application.localization.t(
      "tournament.card.deleteTournament"
    );
    this.domText.quitTournament = await Application.localization.t(
      "tournament.quit.quitBttn"
    );
    this.domText.confirmQuitTxt = await Application.localization.t(
      "tournament.quit.confirmTxt"
    );
    this.domText.confirmYes = await Application.localization.t(
      "tournament.quit.confirmYes"
    );
    this.domText.confirmNo = await Application.localization.t(
      "tournament.quit.confirmNo"
    );
    this.domText.noTournamentToDisplay = await Application.localization.t(
      "tournament.tab.noTournamentToDisplay"
    );
    this.domTextManageTournament = await Application.localization.t(
      "tournament.tab.manage"
    );
    this.domText.close = await Application.localization.t("friends.close");
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
    this.messages.joinSuccess = await Application.localization.t(
      "tournament.join.success"
    );
    this.messages.joinFailure = await Application.localization.t(
      "tournament.join.failure"
    );
    this.messages.alreadyJoined = await Application.localization.t(
      "tournament.card.alreadyJoined"
    );
    this.messages.alreadyJoinedTxt = await Application.localization.t(
      "tournament.tab.alreadyJoinedTxt"
    );
    this.messages.friendInTournament = await Application.localization.t(
      "tournament.card.join.true"
    );
    this.messages.tournamentFull = await Application.localization.t(
      "tournament.card.tournamentFull"
    );
  }

  onStart() {
    this._setTitle(this.domText.title);
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }
    console.log("PANEL STATUS = ", this.panel_status);
    //internal state variables
    
    //AV = saved panel status in a global var in Application to reload the page upon translation on the proper tab
    this.panel_status = Application.tournamentPanelStatus; // toggle for the panel open/in progress/ finished
    this.joined = false; // did the user already joined a tournament

    this._setHtml();
    this.restoreStatus();

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
      //AV = New function to handle refresh if there is no event 
      this.handle_refresh();

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

  //handle the timeouts
  handle_refresh() {
    if (typeof Application.timeoutId === "undefined") {
      Application.timeoutId = null;
    }
  
    if (!this.ongoingEvent) {
      if (Application.timeoutId) {
        clearTimeout(Application.timeoutId);
      }
  
      Application.timeoutId = setTimeout(() => {
        Router.reroute("/tournaments");
        this.restoreStatus();
      }, 6000);
    } else {
      if (Application.timeoutId) {
        clearTimeout(Application.timeoutId);
        Application.timeoutId = null;
      }
    }
  }

  /*

  Event listeners

  */

//AV = method to restore the buttons upon reloading of a page following language change 
  restoreStatus() {
    const newStatus = Application.tournamentPanelStatus;
    const btnStatusOld = document.querySelector(`#status-0`);
    const btnStatusNew = document.querySelector(`#status-${newStatus}`);
    btnStatusOld.classList.remove("active");
    btnStatusNew.classList.add("active");
  }

  switchStatus(event) {
    const oldStatus = this.panel_status;
    const newStatus = Number(event.target.dataset.status);
    this.panel_status = newStatus;
    Application.tournamentPanelStatus = this.panel_status;
    const btnStatusOld = document.querySelector(`#status-${oldStatus}`);
    const btnStatusNew = document.querySelector(`#status-${newStatus}`);
    btnStatusOld.classList.remove("active");
    btnStatusNew.classList.add("active");
    this.refreshPanel();
    Avatar.refreshAvatars();
  }

  async joinTournamentHandler(event) {
    this.ongoingEvent = true;
    this.handle_refresh();
    if (event.target.classList.contains("join-tournament-btn")) {
      const tournamentName = event.target.getAttribute("data-tournament");
      console.log("trying to join", tournamentName);
      try {
        const req = await TRequest.request("POST", "/api/tournament/join/", {
          name: tournamentName,
        });
        Alert.successMessage(
          this.domText.title,
          `${this.messages.joinSuccess} ${tournamentName}`
        );
        Application.joinedTournament = tournamentName;
      } catch (error) {
        Alert.errorMessage(this.messages.joinFailure);
      }
      this.ongoingEvent = false;
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
        selectedTournaments.reverse().forEach((tournament) => {
          if (
            tournament["players"].includes(Application.getUserInfos().userId)
          ) {
            this.joined = true;
          }
        });
        if (!this.joined) {
          panel.appendChild(this.createNewTournamentHeaderPanel());
        }
        else {
          panel.appendChild(this.createNewTournamentHeaderCannotJoin()); //AV (suggestion to be discussed) : another header in case the user already joined a tournament, to explain they can't create or join another tournament while already participating in one. 
        };
        //AV = Modification to fix the undefined error (createOpenHeader not displayed)= added the if
        if (selectedTournaments.length > 0){
        selectedTournaments.forEach((tournament) => {
          panel.appendChild(this.createOpenTournamentCard(tournament));
        });
      }
        break;
      case 1:
        if (selectedTournaments.length > 0) {
          selectedTournaments.reverse().forEach((tournament) => {
            panel.appendChild(this.createTournamentCard(tournament));
        });
      }
      else {
        panel.appendChild(this.createNewNoTournamentHeader());
        break;
      };
        break;
      case 2:
        if (selectedTournaments.length > 0) {
          selectedTournaments.reverse().forEach((tournament) => {
            panel.appendChild(this.createTournamentCard(tournament));
        });
      }
      else {
        panel.appendChild(this.createNewNoTournamentHeader());
      }
        break;
    }
  }

  /*
  HTML Elements creation helpers fucntions :

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
    link.text = this.domText.yourOwn;
    link.dataset.link = 1;
    link.classList.add("text-white", "text-center");
    const header = document.createElement("div");
    header.classList.add("row", "p-2", "w-75");
    header.innerHTML = `<h4 class="text-white text-center">${this.domText.cantFind}</h4>`;
    header.appendChild(link);
    return header;
  }

  //Another header in case the user already joined a tournament, to explain they can't create or join another tournament while already participating in one. 
  createNewTournamentHeaderCannotJoin() {
    const header = document.createElement("div");
    header.classList.add("row", "p-2", "w-75");
    header.innerHTML = `
    <h2 class="text-white text-center fs-5">${this.messages.alreadyJoined}</h2>
    <h4 class="text-white text-center fs-6">
      ${this.messages.alreadyJoinedTxt}
    </h4>
  `
    return header;
}

//Header to display a message in case no tournament is to be displayed in the view 
  createNewNoTournamentHeader() {
    const header = document.createElement("div");
    header.classList.add("row", "p-2", "w-75");
    header.innerHTML = `
    <h2 class="text-white text-center fs-5">${this.domText.noTournamentToDisplay}</h2>`
    return header;
}

  //Updating proper messages depending on the value of freespots and players
  async updateMessages(tournament) {
    return new Promise(async (resolve) => {
    const freeSpots = tournament["size"] - tournament["players"].length;
    let playerTxt = "";
    let spotsTxt = "";

    if (tournament["size"] > 1) {
      playerTxt = await Application.localization.t("tournament.card.players");
    }
    else {
      playerTxt = await Application.localization.t("tournament.card.player");
    };
    console.log(freeSpots);
    if (freeSpots > 1) {
      spotsTxt = await Application.localization.t("tournament.card.spots");
    }
    else {
      spotsTxt = await Application.localization.t("tournament.card.spot");
    };
    resolve({ playerTxt, spotsTxt });
  });

  }

  createOpenTournamentCard(tournament) {
    const card = document.createElement("div");
    const freeSpots = tournament["size"] - tournament["players"].length;
    this.updateMessages(tournament).then((messages) => {


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
				<span class="badge bg-success joined-badge" style="display: none;">${this.domText.joined}</span>
				</h4>
				<h4 class="text-secondary" id="size">${tournament["size"]} ${messages.playerTxt}</h4>
				<h5 class="text-secondary " id="spot-left">${freeSpots} ${messages.spotsTxt}</h5>
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
      // add the joined button if no tournament has been joined yet + manage tournament button 
      actionDiv.innerHTML = `<button type="button" class="btn btn-primary w-50
	  justify-self-center join-tournament-btn" data-tournament="${tournament["tournament name"]}">${this.domText.joinTournament}</button>`;
    } else if (
      tournament["players"].includes(Application.getUserInfos().userId)
    ) {
      const badge = card.querySelector(".joined-badge");
      if (badge) {
        badge.style.display = "inline-block";
      }

      const userId = Application.getUserInfos().userId;
      console.log(tournament["players"][0]);
      const isCreator = (userId === tournament["players"][0]) ? true : false;
      console.log("Is Creator", isCreator);

      const isTournamentFull = tournament["players"].length >= tournament["size"];
      console.log(isTournamentFull);

      //DROPDOWN ACTIONS
      
      actionDiv.innerHTML = `<div class="btn-group">
      <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        ${this.domTextManageTournament}
      </button>
        <ul class="dropdown-menu">
          <li>
            <button 
              class="dropdown-item" 
              data-action="open-invite-modal" 
              data-tournament="${tournament["tournament name"]}"
              ${isTournamentFull ? "disabled" : ""}
              style=${isTournamentFull ? "background-color: grey; cursor: not-allowed color: grey;" : ""}>
              ${this.domText.inviteFriend}
            </button>
          </li>
          <li>
            <button class="dropdown-item" data-action="open-quit-modal" data-tournament="${tournament["tournament name"]}">
              ${this.domText.quitTournament}
            </button>
          </li>
          <li>
            <button class="dropdown-item text-danger" data-action="delete-tournament" data-tournament="${tournament["tournament name"]}"
            style="${!isCreator ? 'display: none;' : ''}">
            ${this.domText.deleteTournament}
            </button>
          </li>
        </ul>
      </div>`
      ;

      //QUIT MODALE

      const quitButton = actionDiv.querySelector(`[data-action="open-quit-modal"]`);
      
      quitButton.addEventListener("click", async () => {
        this.ongoingEvent = true;
        this.handle_refresh();
        const modal = document.createElement("div");
        modal.classList.add("modal", "fade", "show");
        modal.style.display = "block";
        modal.setAttribute("tabindex", "-1");
        modal.setAttribute("aria-labelledby", "quitTournamentModalLabel");

        modal.innerHTML = `
          <div class="modal-dialog">
            <div class="modal-content bg-dark">
              <div class="modal-header">
                <h5 class="modal-title" id="inviteFriendsModalLabel">${this.domText.quitTournament}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <div class="modal-body">
			          <div class="row mx-auto m-5">
                  <h5>${this.domText.confirmQuitTxt}</h5>
			          </div>
			          <div class="row  mx-auto d-flex flex-column justify-content-center gap-5 m-5">
			            <button  class="btn btn-success w-50 align-self-center" id="abort-btn" >${this.domText.confirmNo}</button>
			            <button  class="btn btn-danger w-50 align-self-center" id="confirm-btn" >${this.domText.confirmYes}</button>
			          </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="close-btn">${this.domText.close}</button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#close-btn").addEventListener("click", () => {
          modal.remove();
          this.ongoingEvent = false;
          this.handle_refresh();
        });

        modal.querySelector("#abort-btn").addEventListener("click", () => {
          modal.remove();
          this.ongoingEvent = false;
          this.handle_refresh();
        });

        modal.querySelector("#confirm-btn").addEventListener("click", async () => {
          try {
            const userId = Application.getUserInfos().userId
            console.log("USER ID = ", userId);
            console.log("Sent parameter :", tournament);
            const response = await TRequest.request("POST", "/api/tournament/leave/", 
              { 
                name: tournament["tournament name"],
               });
              console.log(response);
              modal.remove();
              this.ongoingEvent = false;
              Router.reroute("/tournaments");
          } catch (error) {
            modal.remove();
            this.ongoingEvent = false;
            this.handle_refresh();
            Alert.errorMessage("Error", error.message);
          }
        });
        
        modal.querySelector(`[data-bs-dismiss="modal"]`).addEventListener("click", () => {
          modal.remove();
        });
      })

      //DELETE MODALE 

      const deleteButton = actionDiv.querySelector(`[data-action='delete-tournament']`);
        deleteButton.addEventListener("click", async () => {
          this.ongoingEvent = true;
          this.handle_refresh();
          try {
            console.log("Sent parameter :", tournament);
            await TRequest.request("DELETE", "/api/tournament/delete/", { name: tournament["tournament name"] });
            Alert.successMessage("Tournaments", "Tournament deleted successfully"); //TO TRANSLATE
            this.ongoingEvent = false;
            Router.reroute("/tournaments")
          } catch (error) {
            this.ongoingEvent = false;
            this.handle_refresh();
            Alert.errorMessage("Error deleting tournament", error.message); //TO TRANSLATE
          }
        });

      //INVITE MODALE 
      
      const hasFriends = (this.friendsDetails.length === 0) ? false : true;
      console.log("The user has friends", hasFriends);
      console.log("Friend number = ", this.friendsDetails.length);
      const openInviteModalButton = actionDiv.querySelector("[data-action='open-invite-modal']");
      openInviteModalButton.addEventListener("click", () => {
        const modal = document.createElement("div");
        modal.classList.add("modal", "fade", "show");
        modal.style.display = "block";
        modal.setAttribute("tabindex", "-1");
        modal.setAttribute("aria-labelledby", "inviteFriendsModalLabel");

        modal.innerHTML = `
        <div class="modal-dialog">
        <div class="modal-content bg-dark">
          <div class="modal-header">
            <h5 class="modal-title" id="inviteFriendsModalLabel">${this.domText.inviteFriend}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${!hasFriends ? 
            `<p class="text-white text-center">No friends in the list</p>` : 
            `
            <div id="friendsList" class="list-group" style="max-height: 300px; overflow-y: auto;">
              ${this.friendsDetails.map(friend => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center">
                    <img src="${Avatar.url(friend.id)}" class="rounded-circle me-2" width="40" height="40" alt="Avatar">
                    <span>${friend.username}</span>
                  </div>

                      <button class="btn btn-sm ${tournament.players.includes(friend.id) ? 'btn-secondary' : 'btn-primary'}" 
                      ${tournament.players.includes(friend.id) ? 'disabled' : ''}
                      data-action="invite-friend" 
                      data-friend-id="${friend.id}">
                      ${tournament.players.includes(friend.id) ? 'Already in tournament' : this.domText.inviteFriend}
                      </button>



                </div>
              `).join('')}
            </div>
            `
            }
          </div>
          <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="close-btn" >${this.domText.close}</button>
          </div>
        </div>
      </div>
       `;

        document.body.appendChild(modal);

        //Handling event listeners on the invite_buttons
        
        modal.querySelectorAll("[data-action='invite-friend']").forEach(button => {
          button.addEventListener("click", async (event) => {
            const friendId = event.target.getAttribute("data-friend-id");
            if (!friendId) return Alert.errorMessage("Error", "Friend ID not found");
            if (isTournamentFull) return;
            if (tournament.players.includes(friendId)) {
              return Alert.errorMessage("Tournament", friendId + "Already in tournament");
            }
            try {
              console.log("FRIEND ID = ", friendId);
              const response = await TRequest.request("POST", "/api/tournament/invite/", 
                { 
                  tournament_name: tournament["tournament name"],
                  friend_id: friendId,
                 });
      
              if (response.message === "An unexpected error occurred.") {
                throw new Error(this.messages.addFriendFailure);
              }
      
              // modal.remove();
              // Alert.successMessage("Friend", "Invited successfully");
              event.target.textContent = "Invited ✅"; //TO TRANSLATE
              event.target.disabled = true;
            } catch (error) {
              modal.remove();
              Alert.errorMessage("Error", error.message); //TO TRANSLATE
              console.error("In inviteFriend:", error.message);
            }
          });
        });this.ongoingEvent = false;
        this.handle_refresh();

        modal.querySelector("#close-btn").addEventListener("click", () => {
          this.ongoingEvent = false;
          this.handle_refresh();
          modal.remove();
        });
      
        modal.querySelector("[data-bs-dismiss='modal']").addEventListener("click", () => {
          this.ongoingEvent = false;
          this.handle_refresh();
          modal.remove();
        });
      });
      
    }
  });
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
				<h1 class="text-white text-center mb-5">${this.domText.title}</h1>

			<div class="row">
					<div class="btn-group mx-auto align-items-center">
						<button id="status-0" data-status="0" class="btn btn-custom active" aria-current="page">${this.domText.openTournaments}</button>
						<button id="status-1" data-status="1" class="btn btn-custom">${this.domText.tournamentsInProgress}</button>
						<button id="status-2" data-status="2" class="btn btn-custom">${this.domText.finishedTournaments}</button>
					</div>

				</div>
				<div class="row  mt-3 p-3 gap-3 justify-content-center align-items-center  border  overflow-auto scrollable-panel" id="scrollable-panel">
						</div>
			</div>
				</div>
			</div>


      `;
    }
  }

  childOnDestroy(){
    clearTimeout(Application.timeoutId);
  }
}

export default TournamentsView;
