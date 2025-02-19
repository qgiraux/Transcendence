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
    // await Application.setLanguage(Application.lang);
    await this.loadMessages();
    Application.toggleLangSelectorShow();
    this.onStart();
  }

  async loadMessages() {
    await Application.applyTranslations();
    console.log("OK");
    this.domText.title = await Application.localization.t(
      "accountMgmt.twofa.title"
    );
    this.messages.errorTwofa = await Application.localization.t(
      "accountMgmt.twofa.error.token"
    );
    this.messages.errorEmpty = await Application.localization.t(
      "accountMgmt.twofa.errors.empty"
    );
    this.messages.unexpectedError = await Application.localization.t(
      "accountMgmt.twofa.errors.unexpected"
    );
    this.messages.errorExpired = await Application.localization.t(
      "accountMgmt.twofa.errors.expired"
    );
    this.domText.enterCode = await Application.localization.t(
      "accountMgmt.twofa.authent.enterCode"
    );
    this.domText.authenticate = await Application.localization.t(
      "accountMgmt.twofa.authent.authenticate"
    );
    this.messages.authentSuccess = await Application.localization.t(
      "accountMgmt.twofa.authent.success"
    );
    this.messages.authentFailure = await Application.localization.t(
      "accountMgmt.twofa.authent.failure"
    );
    this.domText.rerouteLanding = await Application.localization.t(
      "accountMgmt.twofa.authent.redirectionLanding"
    );
    this.domText.rerouteHome = await Application.localization.t(
      "accountMgmt.twofa.authent.redirectionHome"
    );
    this.domText.countdownOne = await Application.localization.t(
      "accountMgmt.twofa.countdown.partOne"
    );
    this.domText.countdownTwo = await Application.localization.t(
      "accountMgmt.twofa.countdown.partTwo"
    );
  }

  badTokenExit() {
    Alert.errorMessage(this.domText.title, this.messages.errorTwofa);
    setTimeout(() => {
      Router.reroute("/landing");
    }, 20);
  }

  updateCountDown(value) {
    const countdown = document.querySelector("#countdown");
    if (countdown) {
      countdown.textContent = value;
    }
  }

  tokenValidityCheck() {
    const now = new Date();
    const diff = this.validityLimit - now;
    if (diff > 0) {
      this.updateCountDown(`${Math.floor((diff / 1000) % 60)}`);
    } else {
      clearInterval(this.interval);
      this.expireDisplay();
      setTimeout(() => {
        Router.reroute("/landing");
      }, 1000);
    }
  }

  successDisplay() {
    const card = document.querySelector("#twofacard");
    card.innerHTML = `<p class="text-success"> <strong>${this.messages.authentSuccess}</strong><br>${this.domText.rerouteHome}</p>`;
  }

  errorDisplay() {
    const card = document.querySelector("#twofacard");
    card.innerHTML = `<p class="text-danger"> <strong>${this.messages.authentFailure}</strong><br>${this.domText.rerouteLanding}</p>`;
  }

  expireDisplay() {
    const card = document.querySelector("#twofacard");
    card.innerHTML = `<p class="text-danger"> <strong>${this.messages.errorExpired}</strong><br>${this.domText.rerouteLanding}</p>`;
  }

  async loginPressHandler(event) {
    event.stopPropagation();
    clearInterval(this.interval);
    const codeInput = document.querySelector("#twofainput");
    if (codeInput.value.length === 0) {
      Alert.errorMessage(this.domText.title, this.messages.errorEmpty);
      return;
    }
    try {
      const response = await fetch("/api/users/logintwofa/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twofa: codeInput.value,
          token: this.params["token"],
        }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          this.errorDisplay();
          setTimeout(() => {
            Router.reroute("/landing");
          }, 1500);
          return;
        } else {
          throw new Error("server error");
        }
      }
      const json = await response.json();
      Application.setToken(json);
      Application.setUserInfosFromToken();
      this.successDisplay();
      Application.retrieveDBLang();
      Application.setLanguage(Application.lang);
      setTimeout(async () => {
        await Application.toggleSideBar();
        Application.toggleChat();
        Router.reroute("/home");
      }, 1500);
    } catch (error) {
      Alert.errorMessage(this.domText.title, this.messages.unexpectedError);
      setTimeout(() => {
        Router.reroute("/landing");
      }, 1500);
    }
  }

  onStart() {
    if (!this.params["token"]) return this.badTokenExit();
    if (Application.getAccessToken() !== null) {
      setTimeout(() => {
        Router.reroute("/home");
      }, 50);
    }
    this.tokenArray = this.params["token"].split(":");
    if (this.tokenArray.length !== 3) return this.badTokenExit();
    const timestamp = Number(this.tokenArray[1]) * 1000; //the timestamp is in seconds
    this.validityLimit = new Date(timestamp);
    if (isNaN(this.validityLimit.getTime())) return this.badTokenExit();
    this.setHtml();
    this.interval = setInterval(this.tokenValidityCheck.bind(this), 1000);
    this.addEventListener(
      document.querySelector("#twofabutton"),
      "click",
      this.loginPressHandler.bind(this)
    );
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
                    <h1>${this.domText.title}</h1>
                </div>
                <div class="row border rounded border-secondary">
        <div class="row w-75 mw-75 mx-auto text-white container-md p-4 d-flex flex-column align-items-center" id="twofacard">
        <div class="row align-items-start w-100">
    <p id="validitymsg" >${this.domText.countdownOne} <strong id="countdown"></strong> ${this.domText.countdownTwo}
    </p>
        </div>
        <div class="row mb-3 w-100">
          <input type="text" class="form-control mx-auto" id="twofainput" minlength="1" maxlength="20" placeholder="${this.domText.enterCode}" style="max-width: 300px;">
        </div>
        <div class="row w-100">
          <button id="twofabutton" type="button" class="btn btn-primary fs-5 mx-auto" id="alias-update-button" style="width: 200px;">${this.domText.authenticate}</button>
        </div>
      </div>
    </div>
    </div>
	`;
  }

  childOnDestroy() {
    clearInterval(this.interval);
  }
}

export default TwofaLoginView;
