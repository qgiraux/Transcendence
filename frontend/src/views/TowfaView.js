import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";

class TwofaView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("DefaultView");
    this.domText = {};
    this.messages = {};
    this.init();
  }

  async init() {
    await this.loadMessages();
    this.onStart();
  }

  async loadMessages() {
    // Application.localization.loadTranslations();
    await Application.setLanguage(Application.lang);
    // console.log("OK");
    this.domText.title = await Application.localization.t(
      "accountMgmt.twofa.title"
    );
    this.domText.scanQR = await Application.localization.t("twofa.scanQR");
    this.domText.confirmActivation = await Application.localization.t(
      "twofa.enterActivation"
    );
    this.domText.twofaField = await Application.localization.t("twofa.field");
    this.messages.wentWrong = await Application.localization.t(
      "twofa.errors.unexpected"
    );
    this.messages.twofaSuccess = await Application.localization.t(
      "twofa.success"
    );
    this.messages.twofaInvalid = await Application.localization.t(
      "twofa.invalid"
    );
  }

  onStart() {
    this._setTitle("Profile");
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }

    // Make the request to the API to get the PNG image
    TRequest.request("GET", `/api/users/totp/create/`)
      .then((response) => {
        this.imageBlob = response;
        this._setHtml();
      })
      .catch((error) => {
        Alert.errorMessage(this.messages.wentWrong, error.message);
      });
  }

  _setHtml() {
    const container = document.querySelector("#view-container");

    if (container) {
      // Create a blob URL from the binary PNG data
      const imageUrl = URL.createObjectURL(this.imageBlob);

      container.innerHTML = `
		<div style="max-width: 800px;" class="mx-auto w-75 mw-75 align-item-center p-2 ">
			<div class="row mx-auto">
				<h1 class="text-center">TWOFA</h1>
			</div>
				<div class="mt-2"><h3>${this.domText.scanQR}</h3></div>
                <div class="row p-2 d-flex justify-content-center mb-1">
                        <img src="${imageUrl}" class="d-block mx-auto" style="width: 400px; height: 400px; object-fit: contain;" alt="QR Code">
                </div>
                <h3 class="text-white mt-2">${this.domText.confirmActivation}</h3>
                    <div class="row p-2 d-flex justify-content-center mb-1">
                        <input type="text" id="twofa" class="form-control" placeholder="${this.domText.twofaField}">
					</div>
			</div>
            `;
      container
        .querySelector("#twofa")
        .addEventListener("keypress", (event) => {
          if (event.key === "Enter") {
            const twofaCode = container.querySelector("#twofa").value;
            TRequest.request("POST", `/api/users/enable_twofa/`, {
              twofa: twofaCode,
            })
              .then((response) => {
                Alert.successMessage(
                  this.domText.title,
                  this.messages.twofaSuccess
                );
                Application.setTwofa(true);
                Router.reroute("/profile");
              })
              .catch((error) => {
                Alert.errorMessage(
                  this.domText.title,
                  this.messages.twofaInvalid
                );
              });
          }
        });
    }
  }
}

export default TwofaView;
