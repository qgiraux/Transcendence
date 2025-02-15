import Application from "../Application.js";
import Alert from "../Alert.js";
import Localization from "../Localization.js";
import Router from "../Router.js";
import TRequest from "../TRequest.js";
import AbstractView from "./AbstractView.js";

class TwofaLoginView extends AbstractView {
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

  async loadMessages() {}

  onStart() {
    this.setHtml();
  }

  setHtml() {
    const viewContainer = document.getElementById("view-container");
    let pm = "";
    for (const key in this.params) {
      pm += String(key) + " : " + this.params[key] + "<br>";
    }
    viewContainer.innerHTML = `
    <div style="max-width: 800px;" class="mx-auto w-75 mw-75 align-item-center p-2 ">
                <div class="row mx-auto mb-5">
                    <h1>TWOFA VIEW</h1>
                </div>
                <div class="row">${pm}</div>

    </div>


	`;
  }
}

export default TwofaLoginView;
