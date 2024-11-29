import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";

class HomeView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Home");
    this.onStart();
  }

  onStart() {
    if (Application.getAccessToken() === null) {
      Router.reroute("/login");
    } else {
      this._setHtml();
    }
  }

  _setHtml() {
    let pm = "";
    const container = document.querySelector(".container");
    for (const key in this.params) {
      pm += String(key) + " : " + this.params[key] + "<br>";
    }
    if (container) {
      container.innerHTML = `<h1>Welcome back ${
        Application.getUserInfos().userName
      }!</h1>
					`;
    }
  }
}

export default HomeView;
