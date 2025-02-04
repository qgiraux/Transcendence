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
    Router.reroute("/landing");
  }
}

export default RootView;
