import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";

class CreateTournamentView extends AbstractView {
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
    console.log("Trying to load messages");
    await Application.localization.loadTranslations();
    await Application.setLanguage(Application.lang);
    this.domText.title = await Application.localization.t(
      "titles.createTournaments"
    );
    this.domText.createTournamentTxt = await Application.localization.t(
      "tournament.create.txt"
    );
    this.messages.tourNameRequirements = await Application.localization.t(
      "tournament.create.errors.tourNameRequirements"
    );
    this.domText.tournament = await Application.localization.t(
      "titles.tournament"
    );
    this.domText.twoPlayers = await Application.localization.t(
      "tournament.create.twoP"
    );
    this.domText.fourPlayers = await Application.localization.t(
      "tournament.create.fourP"
    );
    this.domText.eightPlayers = await Application.localization.t(
      "tournament.create.eightP"
    );
    this.domText.createBtn = await Application.localization.t(
      "tournament.create.action.txt"
    );
    this.domText.tournamentNameEnter = await Application.localization.t(
      "tournament.create.name.enter"
    );
    this.messages.createSuccess = await Application.localization.t(
      "tournament.create.success"
    );
    this.messages.createFailure = await Application.localization.t(
      "tournament.create.failure"
    );
    console.log("Messages loaded");
  }

  onStart() {
    this._setTitle("Create tournaments");
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
    // this.addEventListener(
    //   document.querySelector("#nav-avatar"),
    //   "click",
    //   this.navHandler.bind(this)
    // );
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
        this.domText.tournament,
        this.messages.tourNameRequirements
      );
      return;
    }
    const size = Number(this.tournamentSize);
    const resp = await TRequest.request("POST", "/api/tournament/create/", {
      name: name,
      size: size,
    });
    if (resp["tournament name"] === undefined) {
      Alert.errorMessage(this.domText.tournament, this.messages.createFailure);
    }
    //AV : I added the else to display a success message and (suggestion to be discussed) reroute to the main tournament page
    else {
      Alert.successMessage(this.domText.tournament, `${this.messages.createSuccess} ${name}`);
      Application.joinedTournament = name;
      Router.reroute("/tournaments");
    }
  }

  validateTournamentName(name) {
    const validatExpr = new RegExp("^[a-zA-Z0-9]{5,16}$");
    return validatExpr.test(name);
  }

  _setHtml() {
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `<div class=" mx-auto" style="max-width: 600px;">
						<div class="row mt-5">
			<h1>${this.domText.createTournamentTxt}</h1>
		</div>
			<div class=" p-4 d-flex flex-column align-items-center justify-content-center scrollable-panel" id="scrollable-panel">
                <div class="btn-group mx-auto align-items-center w-75">
						<button id="size-2" data-size="2" class="btn btn-custom active" aria-current="page">${this.domText.twoPlayers}</button>
						<button id="size-4" data-size="4" class="btn btn-custom">${this.domText.fourPlayers}</button>
						<button id="size-8" data-size="8" class="btn btn-custom">${this.domText.eightPlayers}</button>
					</div>

				<input type="text" class="form-control text-center mt-3 w-75" maxlength="16" minlength="5" id="tournament_name" placeholder="${this.domText.tournamentNameEnter}">

				<button id="createbtn" class="btn btn-primary mt-3 w-75">${this.domText.createBtn}</button>
			</div></div>`;
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
