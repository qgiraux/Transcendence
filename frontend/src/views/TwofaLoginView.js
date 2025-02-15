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

  badTokenExit() {
    Alert.errorMessage("Twofa", "The supplied token is invalid");
    Router.reroute("/landing");
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
      const msg = document.querySelector("#validitymsg");
      if (msg) {
        msg.textContent =
          "The token has expired. You will be redirected to the landing page.";
        setTimeout(() => {
          Router.reroute("/landing");
        }, 1000);
      }
    }
  }

  successDisplay() {
    const card = document.querySelector("#twofacard");
    card.innerHTML = `<p class="text-success"> <strong>Authentication Success !</strong><br>You will be redirected on your home page.</p>`;
  }

  errorDisplay() {
    const card = document.querySelector("#twofacard");
    card.innerHTML = `<p class="text-danger"> <strong>Authentication failure !</strong><br>You will be redirected on the landing page.</p>`;
  }

  async loginPressHandler(event) {
    event.stopPropagation();
    clearInterval(this.interval);
    const codeInput = document.querySelector("#twofainput");
    if (codeInput.value.length === 0) {
      Alert.errorMessage("2FA", "You must enter a code.");
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
      setTimeout(async () => {
        await Application.toggleSideBar();
        Application.toggleChat();
        Router.reroute("/home");
      }, 1500);
    } catch (error) {
      Alert.errorMessage(
        "Server error",
        "An error has occured, please try again."
      );
      setTimeout(() => {
        Router.reroute("/landing");
      }, 1500);
    }
  }

  onStart() {
    this.tokenArray = this.params["token"].split(":");
    console.log(this.tokenArray);
    if (this.tokenArray.length !== 3) return this.badTokenExit();
    const timestamp = Number(this.tokenArray[1]) * 1000; //the timestamp is in seconds
    this.validityLimit = new Date(timestamp);
    console.log("this.validityLimit", this.validityLimit);
    if (isNaN(this.validityLimit.getTime())) return this.badTokenExit();
    console.log("this.validityLimit", this.validityLimit);
    this.interval = setInterval(this.tokenValidityCheck.bind(this), 1000);
    this.setHtml();
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
                    <h1>Two factor authentification</h1>
                </div>
                <div class="row border rounded border-secondary">
        <div class="row w-75 mw-75 mx-auto text-white container-md p-4 d-flex flex-column align-items-center" id="twofacard">
        <div class="row align-items-start w-100">
    <p id="validitymsg" >You have <strong id="countdown">0</strong> seconds left to enter the code from your authenticator app.
    </p>
        </div>
        <div class="row mb-3 w-100">
          <input type="text" class="form-control mx-auto" id="twofainput" minlength="1" maxlength="20" placeholder="Enter 2FA code" style="max-width: 300px;">
        </div>
        <div class="row w-100">
          <button id="twofabutton" type="button" class="btn btn-primary fs-5 mx-auto" id="alias-update-button" style="width: 200px;">Authenticate</button>
        </div>
      </div>
    </div>
    </div>
	`;
  }
}

export default TwofaLoginView;
