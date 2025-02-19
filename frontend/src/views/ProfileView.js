import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Avatar from "../Avatar.js";
import Localization from "../Localization.js";

class ProfileView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("DefaultView");
    this.domText = {};
    this.messages = {};
    this.init();
  }

  async init() {
    console.log(Application.lang);
    // Application.localization.loadTranslations();
    await Application.setLanguage(Application.lang);
    await this.loadMessages();
    Application.toggleLangSelectorShow();
    this.onStart();
  }

  async loadMessages() {
    this.domText = {};
    this.domText.title = await Application.localization.t("titles.profile");
    this.domText.level = await Application.localization.t("profile.level");
    this.domText.gamePlayedNumber = await Application.localization.t(
      "profile.gamePlayedNumber"
    );
    this.domText.victoryNumber = await Application.localization.t(
      "profile.victoryNumber"
    );
    if (this.playerVictoryRemain === 1) {
      this.domText.winRemain = await Application.localization.t(
        "profile.oneWinRemains"
      );
    } else if (this.playerVictoryRemain > 1) {
      this.domText.winRemain = await Application.localization.t(
        "profile.multipleWinsRemain"
      );
    }
    this.domText.table = {};
    this.domText.table.result = await Application.localization.t(
      "profile.table.result"
    );
    this.domText.table.date = await Application.localization.t(
      "profile.table.date"
    );
    this.domText.table.score = await Application.localization.t(
      "profile.table.score"
    );
    this.domText.table.opponent = await Application.localization.t(
      "profile.table.opponent"
    );

    this.messages = {};
    this.messages.errorInitTitle = await Application.localization.t(
      "profile.errorInitTitle"
    );
    this.messages.errorInitBody = await Application.localization.t(
      "profile.errorInitBody"
    );
    this.domText.manageAccount = await Application.localization.t(
      "profile.manageAccount"
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
    this.id = Number(this.params["id"]) || Application.getUserInfos().userId;

    TRequest.request("GET", `/api/users/userinfo/${this.id}`)
      .then((result) => {
        this.currentUserInfos = result;
        return this._getUserStats();
      })
      .then(() => {
        return TRequest.request("GET", "/api/users/userlist/");
      })
      .then((result) => {
        this.userList = result;
        this._setHtml();
        this._displayHistory();
        Avatar.refreshAvatars();
        this._attachEventHandlers();
        setTimeout(() => {
          const bar = document.getElementById("progress-bar");
          const progressPercentage = (5 - this.playerVictoryRemain) * 20;
          bar.style.width = `${progressPercentage}%`;
          bar.style.backgroundColor = "#ff4632";
          bar.setAttribute("aria-valuenow", progressPercentage);
          bar.classList.add(`wp-${progressPercentage}`);
        }, 300);
      })
      .catch((error) => {
        Alert.errorMessage(
          this.messages.errorInitTitle,
          this.messages.errorInitBody
        );
      });
  }

  async _getUserStats() {
    try {
      const stats = await TRequest.request(
        "GET",
        `/api/users/userstats/${this.id}`
      );

      const entries = Object.entries(stats);
      this.playerHistory = entries.map(([k, v]) => ({
        match_id: k,
        ...v,
      }));
      this.playerHistory = this.playerHistory.map((match) => ({
        ...match,
        date: new Date(match.date),
      }));
      this.playerHistory = this.playerHistory.sort((a, b) => {
        return b.date - a.date;
      });
      this.playerMatchPlayed = this.playerHistory.length;
      this.playerMatchWon = this.playerHistory.reduce((victories, current) => {
        return current.win == "yes" ? victories + 1 : victories;
      }, 0);
      this.playerLevel = Math.floor(this.playerMatchWon / 5);
      this.playerVictoryRemain = 5 - (this.playerMatchWon % 5);
      this.loadMessages(); //Quick fix to update the messages; need to be improved (AV)
    } catch (error) {
      Alert.errorMessage(
        "User Stats",
        `Something went wrong: ${error.message}`
      );
    }
  }
  _displayHistory() {
    const table = document.getElementById("table-history");
    this.playerHistory.forEach((match) => {
      const tr = document.createElement("tr");

      const opponent = this.userList.filter((user) => {
        return user.id === Number(match.opponent);
      })[0];
      const nickname = opponent.nickname;
      let opponentProfileLink;
      if (opponent["account_deleted"] === false) {
        opponentProfileLink = `<a href="/profile/${match.opponent}" class="text-decoration-none" data-link style="padding: 0;margin: 0;background-color: transparent;" >${nickname}</a>`;
      } else {
        opponentProfileLink = `<p class="text-secondary" data-link style="padding: 0;margin: 0;background-color: transparent;" >${nickname.toLowerCase()}</p>`;
      }

      tr.innerHTML = `
      <th class="d-flex justify-content-center align-items-center"> ${
        match.win === "yes"
          ? '<img src="/img/winning-cup.png" width="40" height="40" alt="winner"  style="padding: 0;margin: 0; background-color: transparent;">'
          : '<img src="/img/loser.png" width="40" height="40" alt="loser"  style="padding: 0;margin: 0; background-color: transparent;">'
      }</th>
            <td class="text-center">${match.date.toLocaleString("fr-FR")}</td>
          <td class="text-center">${match.score}</td>
          <td class="text-center d-flex align-items-start justify-content-start gap-2"><img src="${Avatar.url(
            match.opponent
          )}" class="rounded-circle border-0" width="40" height="40" alt="${
        match.opponent
      }" style="padding: 0;margin: 0;" data-avatar="${match.opponent}">
     ${opponentProfileLink}
</td>
      `;

      table.appendChild(tr);
    });
  }

  _attachEventHandlers() {
    // const manageBtn = document.querySelector("#manage-btn");
    // if (manageBtn) {
    //   this.addEventListener(
    //     manageBtn,
    //     "click",
    //     this._manageProfileClickHandler.bind(this)
    //   );
    // }

    const aliasBtn = document.querySelector("#alias-btn");
    if (aliasBtn) {
      this.addEventListener(
        aliasBtn,
        "click",
        this._aliasClickHandler.bind(this)
      );
    }

    const modal = document.getElementById("avatarModal");
    if (modal) {
      this.addEventListener(
        modal,
        "hide.bs.modal",
        this._modalSafeClose.bind(this)
      );
      this.addEventListener(
        modal,
        "change",
        this._avataRadioHandler.bind(this)
      );
    }

    const updateButton = document.querySelector("#update-button");
    if (updateButton) {
      this.addEventListener(
        updateButton,
        "click",
        this._avatarButtonHandler.bind(this)
      );
    }
  }

  async _avatarButtonHandler(event) {
    event.stopPropagation();
    if (this.avatarChoice === "reset") {
      TRequest.request("DELETE", "/api/avatar/delete/")
        .then(() => {
          Avatar.refreshAvatars();
        })
        .catch((error) => {
          Alert.errorMessage(this.messages.avatarResetErr, error.message);
        });
    } else if (this.avatarChoice === "update") {
      const fileInput = document.getElementById("fileInput");
      if (!fileInput || fileInput.files.length === 0) {
        Alert.errorMessage(
          this.messages.avatarUpdateErr,
          this.messages.fileSelectFalse
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
        if (typeof r != "object") throw new Error("upload error");
        if (r.hasOwnProperty("error")) {
          throw new Error("upload error");
        }
        await Avatar.refreshAvatars();
      } catch (error) {
        Alert.errorMessage(
          this.messages.avatarRefreshErr,
          this.messages.errUpload
        );
      }
    }

    this._forceModalClose("#avatarModal");
  }

  _avataRadioHandler(event) {
    event.stopPropagation();
    const fileInput = document.querySelector("#fileInput");
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

  _modalSafeClose(event) {
    setTimeout(() => {
      const img = document.getElementById("profile-img");
      if (img) img.focus();
    }, 10);
  }

  _manageProfileClickHandler(event) {
    event.stopPropagation();
    this._showModal("#avatarModal");
  }

  _aliasClickHandler(event) {
    event.stopPropagation();
    this._showModal("#aliasModal");

    const updateAliasBtn = document.querySelector("#update-alias-btn");
    if (updateAliasBtn) {
      this.addEventListener(
        updateAliasBtn,
        "click",
        this._updateAliasHandler.bind(this)
      );
    }
  }

  async _updateAliasHandler(event) {
    event.stopPropagation();

    const aliasInput = document.getElementById("newAliasInput");
    if (!aliasInput) return;

    const newAlias = aliasInput.value.trim();
    if (!newAlias) {
      Alert.errorMessage(
        this.messages.aliasUpdateErr,
        this.messages.aliasEmptyErr
      );
      return;
    }

    try {
      const form = { nickname: newAlias };
      await TRequest.request("POST", "/api/users/newnickname/", form);

      // Update the displayed nickname dynamically
      const nicknameElement = document.querySelector(".display-5");
      if (nicknameElement) {
        nicknameElement.textContent = newAlias;
      }
    } catch (error) {
      Alert.errorMessage(this.messages.wentWrong, error.message);
    }
    this._forceModalClose("#aliasModal");
  }

  _showModal(modalSelector) {
    const modalElement = document.querySelector(modalSelector);
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  _forceModalClose(modalSelector) {
    const modalElement = document.querySelector(modalSelector);
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) modalInstance.hide();
    }
  }

  _setHtml() {
    const profileEdit = `
		<a class="link-offset-2 link-underline link-underline-opacity-0 fw-bold" data-link href="/account">
      <button class="btn btn-primary" type="button">
        ${this.domText.manageAccount}</button></a>
    `;
    const container = document.querySelector("#view-container");

    if (container) {
      container.innerHTML = `
      <div class="row"><h1>${this.domText.title}</h1></div>
      <div class="mt-4 row mx-auto">
        <div class="col-md-6 d-flex flex-column align-items-center justify-content-center">
          <div class="row">
            <img id="profile-img" src="${Avatar.url(
              this.currentUserInfos.id
            )}" width="300" height="300" data-avatar="${
        this.currentUserInfos.id
      }" alt="user" class="rounded-circle img-fluid">
          </div>
          <div class="row mt-2">
            ${this.id === Application.getUserInfos().userId ? profileEdit : ""}
          </div>
        </div>
        <div class="col-6 mb-3 p-2 ">
            <h1 id="nickname">${this.currentUserInfos.nickname}</h1>
            <h2 id="username"><small>@${
              this.currentUserInfos.username
            }</small></h2>
            <div class="card bg-dark text-white p-4 rounded shadow">
              <h2 class="text-center text-white mb-4">${
                this.domText.level
              } <strong>${this.playerLevel}</strong></h2>
              <div class="row mb-3 d-flex justify-content-center align-items-center">
                  <div class="col-6 ">${this.domText.gamePlayedNumber}
                  </div>
                  <div class="col-6 text-end text-white fw-bold fs-3">${
                    this.playerMatchPlayed
                  }
                  </div>
              </div>
              <div class="row mb-3 d-flex justify-content-center align-items-center">
                  <div class="col-6 ">${this.domText.victoryNumber}
                  </div>
                  <div class="col-6 text-end text-white fw-bold fs-4">${
                    this.playerMatchWon
                  }
                  </div>
              </div>
              <div class="progress">
                  <div id="progress-bar" class="progress-bar" role="progressbar"
                      aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="margin-bottom: 0px;">
                  </div>
              </div>
              <div class="text-white" id="victories-left-text">${
                this.playerVictoryRemain
              } ${this.domText.winRemain}
              </div>
            </div>
        </div>
      </div>

      <div id="history-container" class="row p-3 scrollable-panel">
          <div class="user-stats ">
              <table class="table table-dark  table-striped " id="table-history">
                  <tr class="text-center mb-2">
                      <th>${this.domText.table.result}</th>
                      <th>${this.domText.table.date}</th>
                      <th>${this.domText.table.score}</th>
                      <th>${this.domText.table.opponent}</th>
                      <th></th>
                  </tr>
              </table>
          </div>
      </div>
      `;
    }
  }
}

export default ProfileView;
