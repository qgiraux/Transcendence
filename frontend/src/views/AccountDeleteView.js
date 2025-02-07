import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";
import Localization from "../Localization.js";


class AccountDeleteView extends AbstractView {
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

  async loadMessages() {
    this.domText.title = await Application.localization.t(
      "deleteView.title"
    );
    this.domText.confirmationText = await Application.localization.t(
      "deleteView.confirmationText"
    );
    this.domText.confirmationYes = await Application.localization.t(
      "deleteView.confirmationYes"
    );
    this.domText.confirmationNo = await Application.localization.t(
      "deleteView.confirmationNo"
    );
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

  confirm() {}

  setHtml() {
    const viewContainer = document.getElementById("view-container");

    viewContainer.innerHTML = `
<div style="max-width: 800px;" class="mx-auto w-75 mw-75 align-item-center p-2 ">
			<div class="row mx-auto mb-5">
				<h1>${this.domText.title}</h1>
			</div>
			<div class="row mx-auto m-5">
				<h2> <strong> ${
          Application.getUserInfos().userName
        }</strong>${this.domText.confirmationText}</h2>
			</div>
			<div class="row  mx-auto d-flex flex-column justify-content-center gap-5 m-5">
			<button  class="btn btn-success w-50 align-self-center" id="abort-btn" >${this.domText.confirmationNo}</button>
			<button  class="btn btn-danger w-50 align-self-center" id="confirm-btn" > ${this.domText.confirmationYes}</button>
			</div>

</div>


	`;
  }
}

export default AccountDeleteView;
