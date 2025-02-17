import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";
import Localization from "../Localization.js";

class AccountManagementView extends AbstractView {
  constructor(params) {
    super(params);
    this.domText = {};
    this.messages = {};
    this.init();
  }

  async init() {
    // console.log("View loaded on start", Application.activeProfileView);
    await this.loadMessages();
    this.onStart();
  }

  async loadMessages() {
    await Application.localization.loadTranslations();
    await Application.setLanguage(Application.lang);
    await Application.applyTranslations();
    this.messages.wrongCredentialsFormat = await Application.localization.t(
      "accountMgmt.wrongCredentialsFormat"
    );
    this.messages.wentWrong = await Application.localization.t(
      "accountMgmt.errors.unexpected"
    );
    this.messages.aliasEmpty = await Application.localization.t(
      "accountMgmt.alias.empty"
    );
    this.messages.aliasRequirements = await Application.localization.t(
      "accountMgmt.alias.requirements"
    );
    this.messages.aliasUpdateSuccess = await Application.localization.t(
      "accountMgmt.alias.updateSuccess"
    );
    this.messages.aliasUpdateFailure = await Application.localization.t(
      "accountMgmt.alias.updateFailure"
    );
    this.messages.avatarUploadFailure = await Application.localization.t(
      "accountMgmt.avatar.update.uploadFailure"
    );
    this.messages.avatarUploadFileCheck = await Application.localization.t(
      "accountMgmt.avatar.update.uploadFileCheck"
    );
    this.messages.avatarUpdateSuccess = await Application.localization.t(
      "accountMgmt.avatar.update.updateSuccess"
    );
    this.messages.pwdError = await Application.localization.t(
      "accountMgmt.password.error"
    );
    this.messages.oldPwdInvalid = await Application.localization.t(
      "accountMgmt.password.oldError"
    );
    this.messages.pwdEmpty = await Application.localization.t(
      "accountMgmt.password.empty"
    );
    this.messages.pwdMismatch = await Application.localization.t(
      "accountMgmt.password.mismatch"
    );
    this.messages.pwdSuccess = await Application.localization.t(
      "accountMgmt.password.success"
    );
    this.domText.title = await Application.localization.t("titles.account");
    this.domText.manageAvatar = await Application.localization.t(
      "accountMgmt.actions.manageAvatar"
    );
    this.domText.changeAlias = await Application.localization.t(
      "accountMgmt.actions.changeAlias"
    );
    this.domText.changePassword = await Application.localization.t(
      "accountMgmt.actions.changePassword"
    );
    this.domText.manage2FA = await Application.localization.t(
      "accountMgmt.actions.manage2FA"
    );
    this.domText.deleteAccount = await Application.localization.t(
      "accountMgmt.actions.deleteAccount"
    );
    this.domText.close = await Application.localization.t(
      "accountMgmt.actions.closeBtn"
    );
    this.domText.aliasLabel = await Application.localization.t(
      "accountMgmt.alias.label"
    );
    this.domText.aliasField = await Application.localization.t(
      "accountMgmt.alias.field"
    );
    this.domText.aliasUpdate = await Application.localization.t(
      "accountMgmt.alias.update"
    );
    this.domText.avatarTitle = await Application.localization.t(
      "accountMgmt.avatar.title"
    );
    this.messages.avatarSelectFile = await Application.localization.t(
      "accountMgmt.avatar.selectFile"
    );
    this.domText.avatarResetDefault = await Application.localization.t(
      "accountMgmt.avatar.resetDefault"
    );
    this.domText.avatarReset = await Application.localization.t(
      "accountMgmt.avatar.reset.action"
    );
    this.domText.chooseFile = await Application.localization.t(
      "accountMgmt.avatar.chooseFile"
    );
    this.domText.avatarUpdate = await Application.localization.t(
      "accountMgmt.avatar.update.action"
    );
    this.domText.PwdLabel = await Application.localization.t(
      "accountMgmt.password.label"
    );
    this.domText.enterOldPwd = await Application.localization.t(
      "accountMgmt.password.old"
    );
    this.domText.enterNewPwd = await Application.localization.t(
      "accountMgmt.password.new"
    );
    this.domText.confirmNewPwd = await Application.localization.t(
      "accountMgmt.password.confirmNew"
    );
    this.domText.updatePwd = await Application.localization.t(
      "accountMgmt.password.update"
    );
    this.domText.twofaTitle = await Application.localization.t(
      "accountMgmt.twofa.title"
    );
    this.domText.twofaActivate = await Application.localization.t(
      "accountMgmt.twofa.activate"
    );
    this.domText.twofaAlreadyActivated = await Application.localization.t(
      "accountMgmt.twofa.alreadyActivated"
    );
    this.domText.deleteTitle = await Application.localization.t(
      "accountMgmt.delete.title"
    );
    this.domText.deleteIrreversible = await Application.localization.t(
      "accountMgmt.delete.irreversible"
    );
    this.domText.deleteAction = await Application.localization.t(
      "accountMgmt.delete.action"
    );
  }

  onStart() {
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }
    console.log("infos", Application.getUserInfos());

    /*
	View initialization
	*/
    this._setTitle(this.domText.title);
    this.id = this.params["id"] || Application.getUserInfos().userId;

    this.avatarChoice = "reset";
    this._setHtml();
    /*
	Event listeners
	*/
    const avatarRadio = document.getElementById("avatar-radio");
    this.addEventListener(
      avatarRadio,
      "change",
      this._avataRadioHandler.bind(this)
    );
    const avatarButton = document.getElementById("avatar-update-button");
    this.addEventListener(
      avatarButton,
      "click",
      this._avatarButtonHandler.bind(this)
    );
    const aliasButton = document.getElementById("alias-update-button");
    this.addEventListener(
      aliasButton,
      "click",
      this._aliasButtonHandler.bind(this)
    );
    const passwordButton = document.getElementById("password-update-button");
    this.addEventListener(
      passwordButton,
      "click",
      this.passwordButtonHandler.bind(this)
    );

    //AV = added an event listener for the avatar btn so we can navigate back to avatar from another view
    this.addEventListener(
      document.querySelector("#nav-avatar"),
      "click",
      this.navHandler.bind(this)
    );
    this.addEventListener(
      document.querySelector("#nav-alias"),
      "click",
      this.navHandler.bind(this)
    );

    this.addEventListener(
      document.querySelector("#nav-password"),
      "click",
      this.navHandler.bind(this)
    );
    this.addEventListener(
      document.querySelector("#nav-twofa"),
      "click",
      this.navHandler.bind(this)
    );
    this.addEventListener(
      document.querySelector("#nav-delete"),
      "click",
      this.navHandler.bind(this)
    );
    this.setActiveView(Application.activeProfileView);
  }

  /*
Event handlers
*/

  navHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    const navButtons = document.querySelectorAll(".nav-button");
    navButtons.forEach((button) => {
      button.classList.remove("active");
    });
    console.log("Clicked button :", event.target.id);
    console.log(event.target);
    event.target.classList.add("active");
    switch (event.target.id) {
      case "nav-avatar":
        this.setActiveView("avatar");
        break;
      case "nav-alias":
        this.setActiveView("alias");
        break;
      case "nav-password":
        this.setActiveView("password");
        break;
      case "nav-twofa":
        this.setActiveView("twofa");
        break;
      case "nav-delete":
        this.setActiveView("delete");
        break;
    }
  }

  //Method to change the active button if the view is reloaded after a language change
  updateActiveNavButton(viewName) {
    document.querySelectorAll(".nav-button").forEach((button) => {
      button.classList.remove("active");
    });
    let navButtonId = "";
    switch (viewName) {
      case "avatar":
        navButtonId = "nav-avatar";
        break;
      case "alias":
        navButtonId = "nav-alias";
        break;
      case "password":
        navButtonId = "nav-password";
        break;
      case "twofa":
        navButtonId = "nav-twofa";
        break;
      case "delete":
        navButtonId = "nav-delete";
        break;
    }
    const navButton = document.getElementById(navButtonId);
    if (navButton) {
      navButton.classList.add("active");
    }
  }

  setActiveView(viewName) {
    if (!this.messages || !this.domText) this.loadMessages();
    const cards = document.querySelectorAll(".setting-card");
    cards.forEach((card) => {
      if (!card.classList.contains("d-none")) card.classList.add("d-none");
    });

    const newCard = document.querySelector(`#${viewName}`);
    console.log("NewCard found:", newCard);
    newCard.classList.remove("d-none");
    console.log("d-none removed from:", newCard);
    this.updateActiveNavButton(viewName);
    Application.activeProfileView = viewName;
    console.log(
      "New view set in setActiveView: ",
      Application.activeProfileView
    );
  }

  _avataRadioHandler(event) {
    event.stopPropagation();
    const fileInput = document.querySelector("#avatarInput");
    if (event.target.name === "avatarOption") {
      if (event.target.value === "reset") {
        this.avatarChoice = "reset";
        if (fileInput) fileInput.disabled = true;
      } else if (event.target.value === "file") {
        this.avatarChoice = "update";
        if (fileInput) fileInput.disabled = false;
      }
    }
  }

  async _avatarButtonHandler(event) {
    event.stopPropagation();
    if (this.avatarChoice === "reset") {
      TRequest.request("DELETE", "/api/avatar/delete/")
        .then(() => {
          Avatar.refreshAvatars();
          Alert.classicMessage(
            this.domText.avatarTitle,
            `${this.messages.avatarUpdateSuccess}`
          );
        })
        .catch((error) => {
          Alert.errorMessage(
            this.domText.avatarReset,
            `${this.messages.wentWrong} ${error}`
          );
        });
    } else if (this.avatarChoice === "update") {
      const fileInput = document.getElementById("avatarInput");
      if (!fileInput || fileInput.files.length === 0) {
        Alert.errorMessage(
          this.domText.avatarTitle,
          this.domText.avatarSelectFile
        );
        return;
      }

      const formData = new FormData();
      formData.append("image", fileInput.files[0]);

      try {
        const r = await TRequest.request(
          "POST",
          "/api/avatar/upload/",
          formData
        );
        if (typeof r != "object")
          throw new Error(this.messages.avatarUploadFailure);
        if (r.hasOwnProperty("error")) {
          throw new Error(this.messages.avatarUploadFailure);
        }
        await Avatar.refreshAvatars();
        Alert.classicMessage(
          this.domText.avatarTitle,
          `${this.messages.avatarUpdateSuccess}`
        );
      } catch (error) {
        Alert.errorMessage(
          this.domText.avatarTitle,
          `${this.messages.avatarUploadFailure} ${this.messages.avatarUploadFileCheck}`
        );
      }
    }
  }

  async _aliasButtonHandler(event) {
    event.stopPropagation();

    const aliasInput = document.getElementById("newAliasInput");
    if (!aliasInput) return;

    const newAlias = aliasInput.value.trim();
    if (!newAlias) {
      Alert.errorMessage(this.domText.aliasLabel, this.messages.aliasEmpty);
      return;
    }
    if (newAlias.length > 20) {
      Alert.errorMessage(
        this.domText.aliasLabel,
        this.messages.aliasRequirements
      );
      aliasInput.value = "";
      return;
    }

    try {
      const form = { nickname: newAlias };
      const newInfos = await TRequest.request(
        "POST",
        "/api/users/newnickname/",
        form
      );
      Application.setUserInfos(newInfos);

      Alert.successMessage(
        this.domText.aliasLabel,
        this.messages.aliasUpdateSuccess
      );
      Router.reroute("/account");
    } catch (error) {
      Alert.errorMessage(
        this.domText.aliasLabel,
        `${this.messages.aliasUpdateFailure} ${error.message}`
      );
    }
  }

  /*
Set HTML
*/
  _validatePass(passwordValue) {
    const validatExpr = new RegExp(
      "^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$"
    );
    return validatExpr.test(passwordValue);
  }

  async passwordButtonHandler(event) {
    event.stopPropagation();
    const oldPassword = document.querySelector("#oldpasswordinput");
    const input1 = document.querySelector("#newPasswordInput1");
    const input2 = document.querySelector("#newPasswordInput2");

    if (!input1.value || !input2.value || !oldPassword.value) {
      Alert.errorMessage(this.domText.PwdLabel, this.messages.pwdEmpty);
      return;
    }
    if (!this._validatePass(input1.value)) {
      Alert.errorMessage(
        this.domText.PwdLabel,
        this.messages.wrongCredentialsFormat
      );
      return;
    }
    if (input1.value !== input2.value) {
      Alert.errorMessage(this.domText.PwdLabel, this.messages.pwdMismatch);
      return;
    }
    try {
      const req = await TRequest.request("POST", "/api/users/newpassword/", {
        oldpassword: oldPassword.value,
        newpassword: input1.value,
      });
      if (req["success"] !== undefined) {
        Alert.successMessage(this.domText.PwdLabel, this.messages.pwdSuccess);
      }
    } catch (error) {
      if (error.message.includes("401")) {
        Alert.errorMessage(this.domText.PwdLabel, this.messages.oldPwdInvalid);
      } else {
        Alert.errorMessage(this.domText.PwdLabel, this.messages.pwdError);
      }
    }
  }

  //AV : I removed the ternary in 2FA to integrate the translation of activate2FA
  _setHtml() {
    const viewContainer = document.getElementById("view-container");

    viewContainer.innerHTML = `
  <div style="max-width: 800px;" class="mx-auto w-75 mw-75 align-item-center p-2 ">
    <div class="row mx-auto">
      <h1>${this.domText.title}</h1>
    </div>


  <div class="row d-flex flex-row">
        <img id="profile-img" src="${Avatar.url(
          this.id
        )}" width="100" height="100" data-avatar=${
      Application.getUserInfos().userId
    } alt="user"
          class="rounded-circle img-fluid">

    <div class=" col mx-auto d-flex flex-column justify-content-center">
      <h2 class="text-primary display-4" id="nickname">${
        Application.getUserInfos().nickname
      }</h2>
      <h4 class="text-secondary" id="username">@${
        Application.getUserInfos().userName
      }</h4>
    </div>

      <div class="row mb-2">
        <div class=" btn-group mx-auto align-items-center">
          <button id="nav-avatar" class="nav-button btn btn-custom active">${
            this.domText.manageAvatar
          }</button>
          <button id="nav-alias"  class="nav-button btn btn-custom">${
            this.domText.changeAlias
          }</button>
          <button id="nav-password"  class="nav-button btn btn-custom">${
            this.domText.changePassword
          }</button>
          <button id="nav-twofa"  class="nav-button btn btn-custom">${
            this.domText.manage2FA
          }</button>
          <button id="nav-delete"  class="nav-button btn btn-custom">${
            this.domText.deleteAccount
          }</button>
        </div>
      </div>
    <div class=" row mx-auto p-2 scrollable-panel" style="max-width:800px;" id="scrollable-panel">


      <!-- Avatar Card -->
      <div class="setting-card row w-75 mw-75 mx-auto  text-white container-md p-3 d-flex flex-column align-items-center"
        id="avatar">
        <div class="row align-items-start w-100">
          <h2 class="display-6 text-white fw-bold text-center w-100">${
            this.domText.avatarTitle
          }</h2>
        </div>
        <div class="row mt-3 w-100" id="avatar-radio">
          <div class="form-check mx-auto">
            <input class="form-check-input" type="radio" name="avatarOption" id="resetDefault"
              value="reset" checked="">
            <label class="form-check-label fs-5" for="resetDefault">${
              this.domText.avatarResetDefault
            }</label>
          </div>
          <div class="form-check mb-3 mx-auto">
            <input class="form-check-input" type="radio" name="avatarOption" id="uploadFile"
              value="file">
            <label class="form-check-label fs-5" for="uploadFile">${
              this.domText.chooseFile
            }</label>
            <div class="input-group mb-3 mx-auto" style="max-width: 300px;">
              <input type="file" class="form-control" accept="image/png,image/jpeg" id="avatarInput"
                disabled="">
            </div>
            <button type="button" class="btn btn-primary fs-5" id="avatar-update-button"
              style="width: 200px;">${this.domText.avatarUpdate}</button>
          </div>
        </div>
      </div>

      <!-- Alias Card -->
      <div class="setting-card row  w-75 mw-75 mx-auto  text-white container-md p-3 d-flex flex-column align-items-center d-none"
        id="alias">
        <div class="row align-items-start w-100">
          <h2 class="display-6 text-white fw-bold text-center w-100">${
            this.domText.aliasLabel
          }</h2>
        </div>
        <div class="row mb-3 w-100">
          <input type="text" class="form-control mx-auto" id="newAliasInput" minlength="1" maxlength="20"
            placeholder="${this.domText.aliasField}" style="max-width: 300px;">
        </div>
        <div class="row w-100">
          <button type="button" class="btn btn-primary fs-5 mx-auto" id="alias-update-button"
            style="width: 200px;">${this.domText.aliasUpdate}</button>
        </div>
      </div>

      <!-- password Card -->
      <div class="setting-card row w-75 mw-75 mx-auto  text-white container-md p-3 d-flex flex-column align-items-center d-none"
        id="password">
        <div class="row align-items-start w-100">
          <h2 class="display-6 text-white fw-bold text-center w-100">${
            this.domText.PwdLabel
          }</h2>
        </div>
        <form>
        <div class="row align-items-center w-100">
          <h2 class="text-white fs-4 text-center w-100">${
            this.domText.changePassword
          }</h2>
          <div class="row mb-3 w-100">
            <input type="password"  current-password class="form-control mx-auto" id="oldpasswordinput" minlength="1"
              maxlength="20" placeholder="${
                this.domText.enterOldPwd
              }" style="max-width: 300px;">
          </div>
          <div class="row mb-3 w-100">
            <input type="password" new-password class="form-control mx-auto" id="newPasswordInput1" minlength="1"
              maxlength="20" placeholder="${
                this.domText.enterNewPwd
              }" style="max-width: 300px;">
          </div>
          <div class="row mb-3 w-100">
            <input type="password" new-password class="form-control mx-auto" id="newPasswordInput2" minlength="1"
              maxlength="20" placeholder="${
                this.domText.confirmNewPwd
              }" style="max-width: 300px;">
          </div>
          <div class="row w-100">
            <button type="button" class="btn btn-primary fs-5 mx-auto" id="password-update-button"
              style="width: 200px;">${this.domText.updatePwd}</button>
          </div>
        </form>
          </div>
      </div>

      <!-- Authentication Card -->
    <div class="setting-card row w-75 mw-75 mx-auto text-white container-md p-3 d-flex flex-column align-items-center d-none"
      id="twofa">
      <div class="row align-items-start w-100">
        <h2 class="display-4 text-white fw-bold text-center w-100">
          ${this.domText.twofaTitle}
        </h2>

      <div id="twofa-disabled" ${
        Application.getUserInfos().twofa === false
          ? ""
          : 'style="display:none;"'
      }>
        <a href="/twofa" data-link>
          <h5 class="text-center fs-5" data-i18n="accountMgmt.twofa.activate">
            ${this.domText.twofaActivate}
         </h5>
        </a>
      </div>

      <div id="twofa-enabled" ${
        Application.getUserInfos().twofa === true ? "" : 'style="display:none;"'
      }>
        <h5 data-i18n="accountMgmt.twofa.alreadyActivated">
          ${this.domText.twofaAlreadyActivated}
        </h5>
      </div>
      </div>
    </div>



      <!-- Delete Account Card -->
      <div class="setting-card row  w-75 mw-75 mx-auto  text-white container-md p-3 d-flex flex-column align-items-center d-none"
        id="delete">
        <div class="row align-items-start w-100">
          <h2 class="display-6 text-danger fw-bold text-center w-100">${
            this.domText.deleteTitle
          }</h2>
        </div>
        <div class="mx-auto text-center mb-2">
          <p class="text-danger">${this.domText.deleteIrreversible}</p>
        </div>

        <div class="row w-100">
        <a data-link href="/delete" class="text-danger text-center fs-5 mx-auto"> ${
          this.domText.deleteAction
        } </a>
        </div>
      </div>
</div>`;
  }
}

export default AccountManagementView;
