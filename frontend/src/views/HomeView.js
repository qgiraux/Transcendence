import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Router from "../Router.js";

class HomeView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Home");
    this.onStart();
  }

  onStart() {
    if (Application.getAccessToken() === null) {
      Router.reroute("/landing");
    } else {
      this._setHtml();
      this.addEventListener(
        document.querySelector("#refresh-btn"),
        "click",
        this._refreshHandler.bind(this)
      );
      this.addEventListener(
        document.querySelector("#request-btn"),
        "click",
        this._requestHandler.bind(this)
      );
    }
  }

  async _test() {
    try {
      const infos = await TRequest.request("GET", `/api/users/userinfo/`);
      console.log(infos);
    } catch (error) {
      console.log(error);
    }
  }

  async _refreshHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log("old token:", Application.getAccessToken());
    try {
      await TRequest.refreshToken();
      console.log("refresh done:", Application.getAccessToken());
    } catch (error) {
      console.log("the refresh has failed:", error);
    }
  }

  async _requestHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    try {
      const infos = await TRequest.request("GET", "/api/users/userinfo/");
      console.log(infos);
    } catch (error) {
      console.log("the request has failed:", error);
    }
  }

  _setHtml() {
    let pm = "";
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `<h1>Welcome back ${
        Application.getUserInfos().userName
      }!</h1>
	<button id="refresh-btn" class="btn btn-primary">refresh token</button><br>
	<button id="request-btn" class="btn btn-primary">make a request</button>
					`;
    }
  }
}

export default HomeView;
