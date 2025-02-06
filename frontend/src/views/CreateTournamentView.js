import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";

class CreateTournamentView extends AbstractView {
  constructor(params) {
    super(params);
    this.onStart();
  }

  onStart() {
    this._setTitle("Create tournament");
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }
    this._setHtml();
    //internal view states
    this.tournamentSize = 2;

    // set evet handlers

    this.addEventListener(
      document.querySelector("#size-2"),
      "click",
      this.sizeBtnHandler.bind(this)
    );
    this.addEventListener(
      document.querySelector("#size-4"),
      "click",
      this.sizeBtnHandler.bind(this)
    );
    this.addEventListener(
      document.querySelector("#size-8"),
      "click",
      this.sizeBtnHandler.bind(this)
    );

    this.addEventListener(
      document.querySelector("#createbtn"),
      "click",
      this.createTournamentBtnHandler.bind(this)
    );

    this.addEventListener(
      document.querySelector("#nav-avatar"),
      "click",
      this.navHandler.bind(this)
    );
  }

  sizeBtnHandler(event) {
    const oldSize = this.tournamentSize;
    this.tournamentSize = event.target.dataset.size;
    const newSize = event.target.dataset.size;
    const btnSizeOld = document.querySelector(`#size-${oldSize}`);
    const btnSizeNew = document.querySelector(`#size-${newSize}`);
    btnSizeOld.classList.remove("active");
    btnSizeNew.classList.add("active");
  }

  async createTournamentBtnHandler(event) {
    const name = document.querySelector("#tournament_name").value;
    if (!this.validateTournamentName(name)) {
      Alert.errorMessage(
        "Tournament",
        "The tournament name must consist of alphanumeric characters and be between 5 and 16 characters long."
      );
      return;
    }
    const size = Number(this.tournamentSize);
    console.log(size);
    let resp;
    try {
      resp = await TRequest.request("POST", "/api/tournament/create/", {
        name: name,
        size: size,
      });
      if (resp["tournament name"] === undefined) {
        Alert.errorMessage("Tournament", resp["error"]);
        return;
      }
      Alert.successMessage("Tournament", "Tournament created successfully.");
      Router.reroute("/tournaments");
    } catch (error) {
      if (error.message.includes("409"))
        Alert.errorMessage(
          "Tournament",
          "A tournament with this name already exists"
        );
      else {
        Alert.errorMessage("Tournament", "The tournament could not be created");
      }
    }
  }

  validateTournamentName(name) {
    const validatExpr = new RegExp("^[a-zA-Z0-9]{5,16}$");
    return validatExpr.test(name);
  }

  _setHtml() {
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `<div id="view-container" class="container-fluid col py-3"><div class=" mx-auto" style="max-width: 600px;">
						<div class="row mt-5">
			<h1 class="text-white text-center mt-5">Create Tournament</h1>
		</div>
			<div class=" p-4 d-flex flex-column align-items-center justify-content-center" id="scrollable-panel">
                <div class="btn-group mx-auto align-items-center w-75">
						<button id="size-2" data-size="2" class="btn btn-primary active" aria-current="page">2 Players</button>
						<button id="size-4" data-size="4" class="btn btn-primary">4 Players</button>
						<button id="size-8" data-size="8" class="btn btn-primary">8 Players</button>
					</div>

				<input type="text" class="form-control text-center mt-3 w-75" maxlength="16" minlength="5" id="tournament_name" placeholder="Enter the tournament name">

				<button id="createbtn" class="btn btn-primary mt-3 w-75">Create</button>
			</div></div></div>`;
    }
  }
  /*

  Event listeners

  */

  /*
Request API function
*/
}

export default CreateTournamentView;
