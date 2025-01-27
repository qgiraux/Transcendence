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
        this.displayTournaments();
      })
      .then(() => {
        Avatar.refreshAvatars();
      });
    //   .catch((error) => {
    //     Alert.errorMessage("Something went wrong", "Please try again later");
    //   });
  }

  displayTournaments() {
    const panel = document.getElementById("active-panel");
    if (!panel) return;
    const tournaments = this.tournaments.filter((tournament) => {
      return tournament["status"] === this.panel_status;
    });
    switch (this.panel_status) {
      case 0:
        tournaments.forEach((tournament) => {
          panel.appendChild(this.createTournamentCard(tournament));
        });
        break;
      case 1:
        break;
      case 2:
        break;
    }
  }

  _createAvatarImg(player) {
    const img = document.createElement("img");
    img.setAttribute("data-avatar", player);
    img.src = "/api/avatar/picture/default/";
    img.width = 30;
    img.height = 30;
    img.setAttribute("data-link", "");
    img.href = `/profile/${player}`;
    img.classList.add("rounded-circle");
    return img;
  }

  createTournamentCard(tournament) {
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
							<h5 class="text-secondary text-center"> place left</h5>
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
            name: "tournament name",
            players: [1, 2, 3, 4, 5, 6, 7],
            size: 8,
            status: 0,
            rounds: {
              8: [1, 2, 3, 4, 5, 6],
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
			<div class=" mx-auto">
				<h1 class="text-white text-center mb-5">Tournaments</h1>
			</div>
		</div>
		<div class=" d-flex justify-content-center align-items-center m-0 align-middle" style="max-width: 600px;">
			<div class="btn-group mx-auto align-items-center  ">
				<a href="#" class="btn btn-primary active" aria-current="page">Open tournaments</a>
				<a href="#" class="btn btn-primary">Tournaments in progress</a>
				<a href="#" class="btn btn-primary">Finished tournaments</a>
			</div>
		</div>
		<div class="container  mt-3 p-3 justify-content-center align-items-center  h-100 w-75 border border-secndary rounded"
			style="max-width: 600px;" id="active-panel">
			<div class="row mb-3">
				<h2 class=" mx-auto col-9 text-white text-center ">Choose a tournament</h2>
			</div>

		</div>


      `;
    }
  }
}

export default TournamentsView;
