import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";
import Localization from "../Localization.js";

class AccountDeleteView extends AbstractView {
  constructor(params) {
    super(params);
    this.domText = {};
    this.messages = {};
    this.init();
  }

  async init() {
    console.log(Application.lang);
    Application.localization.loadTranslations();
    await Application.setLanguage(Application.lang);
    await this.loadMessages();
    // await Application.applyTranslations();
    this.onStart();
  }

  async loadMessages() {
    this.domText.title = await Application.localization.t("deleteView.title");
    this.domText.confirmationText = await Application.localization.t(
      "deleteView.confirmationText"
    );
    this.domText.confirmationYes = await Application.localization.t(
      "deleteView.confirmationYes"
    );
    this.domText.confirmationNo = await Application.localization.t(
      "deleteView.confirmationNo"
    );
  }

  onStart() {
    this.setHtml();

    this.addEventListener(
      document.querySelector("#abort-btn"),
      "click",
      this.abort.bind(this)
    );
    this.addEventListener(
      document.querySelector("#confirm-btn"),
      "click",
      this.deleteConfirm.bind(this)
    );
  }

  abort() {
    Router.reroute("/home");
  }

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

  async unsubscribeFromAll(tournaments) {
    Promise.all(
      tournaments.map(async (tournament) => {
        try {
          const response = await TRequest.request(
            "POST",
            `/api/tournament/leave/`,
            {
              name: tournament["tournament name"],
            }
          );
          return response;
        } catch (error) {
          Alert.errorMessage(
            "Error",
            "Couldn't unsubscribe from tournament(s). Try to do it manually"
          );
          return;
        }
      })
    );
  }

  async deleteConfirm() {
    const tournaments = await TRequest.request("GET", "/api/tournament/list/");

    const detailedTournamentsList = await this.fetchTournamentDetails(
      tournaments["tournaments"]
    );
    const subscribedList = detailedTournamentsList.filter((tournament) => {
      return (
        tournament.status !== 2 &&
        tournament.players.includes(Application.getUserInfos().userId)
      );
    });

    subscribedList.forEach((tournament) => {
      // if the user has an tournament in progress , refuse to delete his account
      if (tournament.status === 1) {
        Alert.errorMessage(
          "You have a tournament in progress",
          "unsubscribe or give up before deleting your account"
        );
        return;
      }
    });

    //Unsubscribe the player form all tournaments
    await this.unsubscribeFromAll(subscribedList);

    // Delete all the friends of the player
    try {
      const friendsList = await TRequest.request(
        "GET",
        "/api/friends/friendslist/"
      );
      for (const friendId of friendsList["friends"]) {
        await TRequest.request("DELETE", "/api/friends/removefriend/", {
          id: friendId,
        });
      }
      //where other playrs added the player as a friend

      // Delete all the blocks
      //where the player blocks other players
      const blocksList = await TRequest.request(
        "GET",
        "/api/friends/blocks/blockslist/"
      );
      for (const blockId of blocksList["blocks"]) {
        await TRequest.request("DELETE", "/api/friends/blocks/removeblock/", {
          id: blockId,
        });
      }
      //where other playrs block the player

      // Delete profile picture
      await TRequest.request("DELETE", "/api/avatar/delete/");
      // Annonymise the user in the db and revoque credentials
      await TRequest.request("DELETE", "/api/users/deleteuser/");
      Router.reroute("/logout");
    } catch (error) {
      Alert.errorMessage("Account Delete", error.message);
    }
  }

  setHtml() {
    const viewContainer = document.getElementById("view-container");

    viewContainer.innerHTML = `
<div style="max-width: 800px;" class="mx-auto w-75 mw-75 align-item-center p-2 ">
			<div class="row mx-auto mb-5">
				<h1>${this.domText.title}</h1>
			</div>
			<div class="row mx-auto m-5">
				<h2> <strong> ${Application.getUserInfos().userName}</strong> ${
      this.domText.confirmationText
    }</h2>
			</div>
			<div class="row  mx-auto d-flex flex-column justify-content-center gap-5 m-5">
			<button  class="btn btn-success w-50 align-self-center" id="abort-btn" >${
        this.domText.confirmationNo
      }</button>
			<button  class="btn btn-danger w-50 align-self-center" id="confirm-btn" >${
        this.domText.confirmationYes
      }</button>
			</div>

</div>


	`;
  }
}

export default AccountDeleteView;
