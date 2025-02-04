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

    this.messages = {};
    this.messages.INVALID_TOURNAMENT_NAME =
      "The tournament name must contains only alphabetical characters ";

    // set evet handlers
    const size2Btn = document.querySelector("#size-2");
    const size4Btn = document.querySelector("#size-4");
    const size8Btn = document.querySelector("#size-8");
  }

  sizeBtnHandler(event) {
    this.tournamentSize = event.target.dataset.size;
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

				<button class="btn btn-primary mt-3 w-75">Create</button>
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
