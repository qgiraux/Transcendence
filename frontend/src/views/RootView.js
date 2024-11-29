import Application from "../Application.js";
import Router from "../Router.js";
import AbstractView from "./AbstractView.js";

class RootView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Transcendence");
    this.onStart();
  }

  onStart() {
    if (Application.getAccessToken === null) {
      Router.reroute("/login");
    } else {
      Router.reroute("/home");
    }
  }
}

export default RootView;
