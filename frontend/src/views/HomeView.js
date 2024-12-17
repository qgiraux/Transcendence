import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";

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
      Avatar.getPictures();
    }
  }

  _setHtml() {
    let pm = "";
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `<h1 class="text-white display-1">${
        Application.getUserInfos().userName
      } welcome to your home page!</h1>
					`;
    }
  }
}

export default HomeView;
