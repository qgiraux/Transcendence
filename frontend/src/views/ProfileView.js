import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Avatar from "../Avatar.js";

class ProfileView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("DefaultView");
    this.onStart();
  }

  onStart() {
    this._setTitle("Profile");
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }
    this.id = this.params["id"] || Application.getUserInfos().userId;
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
          bar.style.width = `${(5 - this.playerVictoryRemain) * 20}%`;
        }, 300);
      })
      .catch((error) => {
        Alert.errorMessage("Something went wrong", error.message);
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
        return a.date - b.date;
      });
      this.playerMatchPlayed = this.playerHistory.length;
      this.playerMatchWon = this.playerHistory.reduce((victories, current) => {
        return current.win == "yes" ? victories + 1 : victories;
      }, 0);
      this.playerLevel = Math.floor(this.playerMatchWon / 5);
      this.playerVictoryRemain = 5 - (this.playerMatchWon % 5);
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
      const nickname = this.userList.filter((user) => {
        return user.id === Number(match.opponent);
      })[0].nickname;

      tr.innerHTML = `
      <th class="d-flex justify-content-center align-items-center"> ${
        match.win === "yes"
          ? '<img src="/img/winning-cup.png" width="40" height="40" alt="winner"  style="padding: 0;margin: 0; background-color: transparent;">'
          : '<img src="/img/loser.png" width="40" height="40" alt="loser"  style="padding: 0;margin: 0; background-color: transparent;">'
      }</th>
            <td class="text-center">${match.date.toLocaleDateString(
              "fr-FR"
            )}</td>
          <td class="text-center">${match.score}</td>
          <td class="text-center d-flex align-items-start justify-content-start gap-2"><img src="${Avatar.url(
            match.opponent
          )}" class="rounded-circle border-0" width="40" height="40" alt="${
        match.opponent
      }" style="padding: 0;margin: 0;" data-avatar="${
        match.opponent
      }"> <a href="/profile/${
        match.opponent
      }"  class="text-decoration-none" data-link style="padding: 0;margin: 0;background-color: transparent;" >${nickname}</a></td>`;

      table.appendChild(tr);
    });
  }

  _attachEventHandlers() {
    const manageBtn = document.querySelector("#manage-btn");
    if (manageBtn) {
      this.addEventListener(
        manageBtn,
        "click",
        this._manageProfileClickHandler.bind(this)
      );
    }

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
          Alert.errorMessage("Avatar reset", `Something went wrong: ${error}`);
        });
    } else if (this.avatarChoice === "update") {
      const fileInput = document.getElementById("fileInput");
      if (!fileInput || fileInput.files.length === 0) {
        Alert.errorMessage("Avatar", "You must select a file");
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
          "Avatar",
          `The picture could't be uploaded.
            Please check that it is a valid jpeg or png file, less or equal than 5MB`
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
      Alert.errorMessage("Alias", "Alias cannot be empty.");
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
      Alert.errorMessage("Alias", `Failed to update alias: ${error.message}`);
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
      <button class="btn btn-primary" id="manage-btn">Manage Avatar</button>
    `;
    const profileAlias = `
      <button class="btn btn-primary" id="alias-btn">Change Alias</button>
    `;
    const profileTwofa = `
      <label class="btn btn-primary">
        Activate 2FA
        <a href="/twofa" data-link class="nav-link px-0 align-middle">profile</a>
      </label>
    `;
    const container = document.querySelector("#view-container");

    if (container) {
      container.innerHTML = `
        <!-- Alias Modal -->
        <div class="modal fade text-white" id="aliasModal" tabindex="-1" aria-labelledby="aliasModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content bg-dark">
              <div class="modal-header">
                <h2>Change Alias</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label for="newAliasInput" class="form-label">New Alias</label>
                  <input type="text" class="form-control" id="newAliasInput" placeholder="Enter new alias">
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="update-alias-btn" data-bs-dismiss="modal">Update Alias</button>
              </div>
            </div>
          </div>
        </div>
        <!-- END Alias Modal -->

        <!-- Avatar Modal -->
        <div class="modal fade text-white" id="avatarModal" tabindex="-1" aria-labelledby="avatarModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content bg-dark">
              <div class="modal-header">
                <h2>Avatar Settings</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="mt-3">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="avatarOption" id="resetDefault" value="reset" checked>
                  <label class="form-check-label" for="resetDefault">Reset to Default</label>
                </div>
                <div class="form-check mb-3">
                  <input class="form-check-input" type="radio" name="avatarOption" id="uploadFile" value="file">
                  <label class="form-check-label" for="uploadFile">Choose from File</label>
                  <div class="input-group mb-3">
                    <div class="custom-file">
                      <input type="file" class="custom-file-input" accept="image/png,image/jpeg" id="fileInput" disabled>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="update-button" data-bs-dismiss="modal">Update</button>
              </div>
            </div>
          </div>
        </div>
        <!-- END Avatar Modal -->

        <div class="row p-1 mb-4 ">
            <div class="row align-items-center">
                <div class="col-md-6">
              <img id="profile-img" src="${Avatar.url(
                this.currentUserInfos.id
              )}" width="300" height="300" data-avatar="${
        this.currentUserInfos.id
      }" alt="user" class="rounded-circle">
            </div>
                <div class="col-6 mb-3 p-2 border border-secondary rounded ">
                    <h1 class="text-primary display-6 fw-bold" id="nickname">${
                      this.currentUserInfos.nickname
                    }</h1>
                    <p class="text-secondary " id="username">@${
                      this.currentUserInfos.username
                    }</p>
                    <div class="card bg-dark text-white p-4 rounded shadow">
                        <h2 class="text-center text-white mb-4">Level <strong>${
                          this.playerLevel
                        }</strong></h2>
                        <div class="row mb-3 d-flex justify-content-center align-items-center">
                            <div class="col-6 text-primary">Games played</div>
                            <div class="col-6 text-end text-white fw-bold fs-3">${
                              this.playerMatchPlayed
                            }</div>
                        </div>
                        <div class="row mb-3 d-flex justify-content-center align-items-center">
                            <div class="col-6 text-primary">Victories</div>
                            <div class="col-6 text-end text-white fw-bold fs-4">${
                              this.playerMatchWon
                            }</div>
                        </div>
                        <div class="progress " style="height: 10px; border-radius: 5px;">
                            <div id="progress-bar" class="progress-bar" role="progressbar"
                                style="width: 0%; background-color: #76c7c0;" aria-valuenow="50" aria-valuemin="0"
                                aria-valuemax="100">
                            </div>
                        </div>
                        <div class="text-white" id="victories-left-text">Win ${
                          this.playerVictoryRemain
                        } more games to reach next level!
                        </div>
                    </div>
                </div>
                <br>
            </div>

            ${
              this.currentUserInfos.id === Application.getUserInfos().userId
                ? profileEdit
                : ""
            }
            <div id="history-container" class="row">
                <div class="user-stats">
                    <table class="table table-dark  table-striped" id="table-history">
                        <tr class="text-center">
                            <th>Result</th>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Opponent</th>
                        </tr>
                    </table>
                </div>
            </div>
      `;
    }
  }
}

export default ProfileView;
