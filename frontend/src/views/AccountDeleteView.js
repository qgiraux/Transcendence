import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";

class AccountDeleteView extends AbstractView {
  constructor(params) {
    super(params);
    this.onStart();
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
      this.confirm.bind(this)
    );
  }

  abort() {
    Router.reroute("/home");
  }

  async confirm() {
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

      const blocksList = await TRequest.request(
        "GET",
        "/api/friends/blocks/blockslist/"
      );
      for (const blockId of blocksList["blocks"]) {
        await TRequest.request("DELETE", "/api/friends/blocks/removeblock/", {
          id: blockId,
        });
      }
      await TRequest.request("DELETE", "/api/avatar/delete/");

      await TRequest.request("DELETE", "/api/users/deleteuser/");
      console.log("I have to logout now");
      Application.logout();
      Application.hideSideBar();
      Router.reroute("/landing");
    } catch (error) {
      Alert.errorMessage("Account Delete", "An error has occured");
    }
  }

  setHtml() {
    const viewContainer = document.getElementById("view-container");

    viewContainer.innerHTML = `
<div style="max-width: 800px;" class="mx-auto w-75 mw-75 align-item-center p-2 ">
			<div class="row mx-auto mb-5">
				<h1>Delete account</h1>
			</div>
			<div class="row mx-auto m-5">
				<h2> <strong> ${
          Application.getUserInfos().userName
        }</strong> Are you sure you want to delete your account?</h2>
			</div>
			<div class="row  mx-auto d-flex flex-column justify-content-center gap-5 m-5">
			<button  class="btn btn-success w-50 align-self-center" id="abort-btn" > 😊 No I want to keep playing !</button>
			<button  class="btn btn-danger w-50 align-self-center" id="confirm-btn" > 😔 Yes I want to delete my account</button>
			</div>

</div>


	`;
  }
}

export default AccountDeleteView;
