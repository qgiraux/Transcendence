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
    //internal state toggle
    this.panel_status = 0;

    this._setHtml();
    TRequest.request("GET", "/api/friends/friendslist/")
      .then((result) => {
        this.friends = result;
      })
      .catch((error) => {
        Alert.errorMessage(
          "Tournament",
          "An error has occured. Please try again later"
        );
      });

    TRequest.request("GET", "/api/tournament/list/")
      .then((result) => {
        // return this.fetchTournamentDetails(result["tournaments"]);
        return this.fetchTournamentDetails(["tournoi1"]); //placeholder
      })
      .then((tournaments) => {
        this.tournaments = tournaments;
      })
      .then(() => {
        this.refreshPanel();
        Avatar.refreshAvatars();
      });
    //   .catch((error) => {
    //     Alert.errorMessage("Something went wrong", "Please try again later");
    //   });
    const btnStatus0 = document.querySelector("#status-0");
    const btnStatus1 = document.querySelector("#status-1");
    const btnStatus2 = document.querySelector("#status-2");
    this.addEventListener(btnStatus0, "click", this.switchStatus.bind(this));
    this.addEventListener(btnStatus1, "click", this.switchStatus.bind(this));
    this.addEventListener(btnStatus2, "click", this.switchStatus.bind(this));
  }

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

  refreshPanel() {
    const panel = document.getElementById("active-panel");
    if (!panel) return;
    panel.innerHTML = "";
    const tournaments = this.tournaments.filter((tournament) => {
      return tournament["status"] === this.panel_status;
    });
    switch (this.panel_status) {
      case 0:
        tournaments.forEach((tournament) => {
          panel.appendChild(this.createOpenTournamentCard(tournament));
        });
        break;
      case 1:
        tournaments.forEach((tournament) => {
          panel.appendChild(this.createEightPlayersTournamentCard(tournament));
          panel.appendChild(this.createEightPlayersTournamentCard(tournament));
        });
        break;
      case 2:
        tournaments.forEach((tournament) => {
          panel.appendChild(this.createOpenTournamentCard(tournament));
        });
        break;
    }
  }

  _createAvatarImg(player) {
    const img = document.createElement("img");
    img.setAttribute("data-avatar", player);
    img.src = "/api/avatar/picture/5f9e0fc9-fbdf-4196-88b3-3dc8770b97e3/";
    img.width = 30;
    img.height = 30;
    img.setAttribute("data-link", "");
    img.href = `/profile/${player}`;
    img.classList.add("rounded-circle");
    return img;
  }

  createOpenTournamentCard(tournament) {
    const card = document.createElement("div");
    card.classList.add("row");
    card.classList.add("p-1");
    card.innerHTML = `
		<div class="row p-1">
			<div class="card mx-auto col-9 bg-dark text-white border border-secondary rounded">
				<div class="card-body d-flex">
					<div class="content w-75">
						<h4 class="card-title"></h4>
						<div class="d-flex  gap-2 mt-1" id="players-avatar-1">
						</div>
						<div class="d-flex  gap-2 mt-1" id="players-avatar-2">
						</div>
					</div>
					<div class=" w-50 d-flex gap-1 flex-column">
						<div>
							<h5 id="place-left" class="text-secondary text-center"> place left</h5>
						</div>
						<button type="button" class="btn btn-success  btn-sm">Join</button>
						<button class="btn btn-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown"
							aria-expanded="false">
							Invite a friend
						</button>
					</div>
				</div>
			</div>
		</div>
	`;
    const title = card.querySelector(".card-title");
    title.textContent = tournament["name"];
    const placeLeft = card.querySelector("#place-left");
    placeLeft.textContent = `${
      tournament["size"] - tournament["players"].length
    } places left`;
    const avatars_row1 = card.querySelector("#players-avatar-1");
    const avatars_row2 = card.querySelector("#players-avatar-2");
    console.log("players", tournament["players"]);
    let firstHalf = [];
    let secondHalf = [];
    if (tournament["size"] > 4) {
      firstHalf = tournament["players"].slice(
        0,
        Math.ceil(tournament["players"].length / 2)
      );
      secondHalf = tournament["players"].slice(
        Math.ceil(tournament["players"].length / 2)
      );
    } else {
      firstHalf = tournament["players"];
    }

    firstHalf.forEach((player) => {
      avatars_row1.appendChild(this._createAvatarImg(player));
    });
    secondHalf.forEach((player) => {
      avatars_row2.appendChild(this._createAvatarImg(player));
    });

    return card;
  }

  /*
  une fonction qui retourne le user id correspondant a la poule et a l'index
  retourne  otherwise

*/
  getIdfromTournament(tournament, round, index) {
    if (!tournament["rounds"][round]) return 0;
    if (tournament["rounds"][round].length <= index) return 0;
    return tournament["rounds"][round][index];
  }

  getProfileLinkformId(id) {
    if (id === 0) return "";
    return `href="/profile/${id}"`;
  }
  createEightPlayersTournamentCard(tournament) {
    const card = document.createElement("div");
    card.classList.add(
      "row",
      "bg-dark",
      "text-white",
      "border",
      "border-secondary",
      "rounded",
      "p-2",
      "mb-2"
    );

    card.innerHTML = `
			<div class="row mt-1">
				<h4 class="fw-bold">${tournament["name"]}</h4>
			</div>
			<!-- 8 players-->
			<div class="col  justify-content-center align-items-center p-1">
				<div
					class="match d-flex justify-content-center align-items-center mb-2 p-1 rounded bg-primary gap-1">
					<a data-link ${this.getProfileLinkformId(
            this.getIdfromTournament(tournament, "8", 0)
          )}>
		  <img src="${
        this.getIdfromTournament(tournament, "8", 0) !== 0
          ? Avatar.url(this.getIdfromTournament(tournament, "8", 0))
          : "/img/question_mark_icon.png"
      }" width="40" height="40" class="rounded rounded-circle"></a>

	<a data-link ${this.getProfileLinkformId(
    this.getIdfromTournament(tournament, "8", 1)
  )}>
					<img src="${
            this.getIdfromTournament(tournament, "8", 1) !== 0
              ? Avatar.url(this.getIdfromTournament(tournament, "8", 1))
              : "/img/question_mark_icon.png"
          }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur 2"></a>
				</div>
				<div
					class="match d-flex justify-content-center align-items-center mb-2 p-1 rounded bg-primary gap-1">
					<a data-link ${this.getProfileLinkformId(
            this.getIdfromTournament(tournament, "8", 2)
          )}>
					<img src="${
            this.getIdfromTournament(tournament, "8", 2) !== 0
              ? Avatar.url(this.getIdfromTournament(tournament, "8", 2))
              : "/img/question_mark_icon.png"
          }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur 3"></a>


					<a data-link ${this.getProfileLinkformId(
            this.getIdfromTournament(tournament, "8", 3)
          )}>	<img src="${
      this.getIdfromTournament(tournament, "8", 3) !== 0
        ? Avatar.url(this.getIdfromTournament(tournament, "8", 3))
        : "/img/question_mark_icon.png"
    }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur 4"></a>
				</div>
				<div
					class="match d-flex justify-content-center align-items-center mb-2 p-1 rounded bg-primary gap-1">
				<a data-link ${this.getProfileLinkformId(
          this.getIdfromTournament(tournament, "8", 4)
        )}>	<img src="${
      this.getIdfromTournament(tournament, "8", 4) !== 0
        ? Avatar.url(this.getIdfromTournament(tournament, "8", 4))
        : "/img/question_mark_icon.png"
    }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur 5"></a>
					<a data-link ${this.getProfileLinkformId(
            this.getIdfromTournament(tournament, "8", 5)
          )}><img src="${
      this.getIdfromTournament(tournament, "8", 5) !== 0
        ? Avatar.url(this.getIdfromTournament(tournament, "8", 5))
        : "/img/question_mark_icon.png"
    }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur 6"></a>
				</div>
				<div
					class="match d-flex justify-content-center align-items-center mb-2 p-1 rounded bg-primary gap-1">
					<a data-link ${this.getProfileLinkformId(
            this.getIdfromTournament(tournament, "8", 6)
          )}><img src="${
      this.getIdfromTournament(tournament, "8", 6) !== 0
        ? Avatar.url(this.getIdfromTournament(tournament, "8", 6))
        : "/img/question_mark_icon.png"
    }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur 7">

					<a data-link ${this.getProfileLinkformId(
            this.getIdfromTournament(tournament, "8", 7)
          )}><img src="${
      this.getIdfromTournament(tournament, "8", 7) !== 0
        ? Avatar.url(this.getIdfromTournament(tournament, "8", 7))
        : "/img/question_mark_icon.png"
    }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur 8"></a>
				</div>
			</div>



			<!-- 4 players-->
			<div class="col d-flex flex-column justify-content-center">
				<div
					class="match d-flex justify-content-center align-items-center mb-2 p-1 rounded bg-primary gap-1">
					<img src="${
            this.getIdfromTournament(tournament, "4", 0) !== 0
              ? Avatar.url(this.getIdfromTournament(tournament, "4", 0))
              : "/img/question_mark_icon.png"
          }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur A">
					<img src="${
            this.getIdfromTournament(tournament, "4", 1) !== 0
              ? Avatar.url(this.getIdfromTournament(tournament, "4", 1))
              : "/img/question_mark_icon.png"
          }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur B">
				</div>
				<div
					class="match d-flex justify-content-center align-items-center mb-2 p-1 rounded bg-primary gap-1">
					<img src="${
            this.getIdfromTournament(tournament, "4", 2) !== 0
              ? Avatar.url(this.getIdfromTournament(tournament, "4", 2))
              : "/img/question_mark_icon.png"
          }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur C">
					<img src="${
            this.getIdfromTournament(tournament, "4", 3) !== 0
              ? Avatar.url(this.getIdfromTournament(tournament, "4", 3))
              : "/img/question_mark_icon.png"
          }" width="40" height="40" class="rounded rounded-circle"
						alt="Joueur D">
				</div>
			</div>

			<!-- 2 players-->
			<div class="col d-flex flex-column justify-content-center">
				<div
					class="match d-flex justify-content-center align-items-center mb-2 p-1 rounded bg-primary gap-1">
					<img src="${
            this.getIdfromTournament(tournament, "2", 0) !== 0
              ? Avatar.url(this.getIdfromTournament(tournament, "2", 0))
              : "/img/question_mark_icon.png"
          }" width="40" height="40" class="rounded rounded-circle"
						alt="Finaliste 1">
					<img src="${
            this.getIdfromTournament(tournament, "2", 1) !== 0
              ? Avatar.url(this.getIdfromTournament(tournament, "2", 1))
              : "/img/question_mark_icon.png"
          }" width="40" height="40" class="rounded rounded-circle"
						alt="Finaliste 2">
				</div>
			</div>

			<!-- Winner !-->
			<div class="col d-flex flex-column justify-content-center">
				<div class="match d-flex justify-content-center align-items-center mb-2 p-1 rounded ">
					<img src="${
            this.getIdfromTournament(tournament, "1", 0) !== 0
              ? Avatar.url(this.getIdfromTournament(tournament, "1", 0))
              : "/img/question_mark_icon.png"
          }" width="90" height="90"
						class="rounded rounded-circle border border-warning" alt="Vainqueur">
				</div>
			</div>
	`;
    return card;
  }

  async fetchTournamentDetails(names) {
    const details = await Promise.all(
      names.map(async (name) => {
        try {
          const response = await TRequest.request(
            "GET",
            `/api/tournament/details/${name}/`
          );
          return response;
        } catch (error) {
          //   return null;
          return {
            /// placeholder
            name: "my tournament",
            players: [1, 2, 3, 4, 5, 6, 7],
            size: 8,
            status: 1,
            rounds: {
              8: [1, 2, 3, 4, 5, 6, 7],
            },
          };
        }
      })
    );
    return details;
  }

  _setHtml() {
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `
				<div class="row ">
			<div class=" mx-auto" style="max-width: 700px;">
				<h1 class="text-white text-center mb-5">Tournaments</h1>

				<div class="row">
					<div class="btn-group mx-auto align-items-center">
						<button id="status-0" data-status="0" class="btn btn-primary" aria-current="page">Open
							tournaments</button>
						<button id="status-1" data-status="1" class="btn btn-primary">Tournaments in progress</button>
						<button id="status-2" data-status="2" class="btn btn-primary active">Finished
							tournaments</button>
					</div>

				</div>
				<div class="row  mt-3 p-3 justify-content-center align-items-center  border border-secondary rounded"
					id="active-panel">
						</div>
			</div>
				</div>





























			</div>
		</div>


      `;
    }
  }
}

export default TournamentsView;
