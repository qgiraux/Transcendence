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

        Avatar.refreshAvatars().then(() => {
          this._setHtml();
          this._attachEventHandlers();
          this._userStats();
        });
      })
      .catch((error) => {
        Alert.errorMessage("Something went wrong", error.message);
      });
  }

  _userStats() {
    TRequest.request("GET", `/api/users/userstats/${this.id}`)
      .then((result) => {
        // Assuming result is an object like { "001": { ...stats } }
        const statsContainer = document.createElement("div");
        statsContainer.className = "user-stats";
        let stats;

        // Create the table with headers and rows
        const table = document.createElement("table");
        table.className = "table table-dark table-striped";

        // Create the table header row with fixed order 'date', 'win', 'score', 'opponent'
        const headerRow = document.createElement("tr");

        // Create the headers in the correct order
        const headers = ["date", "win", "score", "opponent"];
        headers.forEach((header) => {
          const th = document.createElement("th");
          th.textContent = header.charAt(0).toUpperCase() + header.slice(1); // Capitalize first letter
          headerRow.appendChild(th);
        });

        table.appendChild(headerRow); // Append the header row

        // Sort the result based on the 'date' field in descending order (most recent first)
        const sortedStats = Object.values(result).sort((a, b) => {
          const dateA = new Date(a.date); // Convert 'date' string to Date object
          const dateB = new Date(b.date); // Convert 'date' string to Date object
          return dateB - dateA; // Sort in descending order (most recent first)
        });

        // Create the table body, where each row corresponds to a stat (e.g., "001", "002")
        sortedStats.forEach((stat) => {
          const row = document.createElement("tr");

          // For each stat, create a table cell (td) in the correct order: date, win, score, opponent
          const cells = ["date", "win", "score", "opponent"];
          cells.forEach((key) => {
            const td = document.createElement("td");
            td.textContent = stat[key]; // Use the value of the field
            row.appendChild(td);
          });

          table.appendChild(row); // Append each row to the table
        });

        // Append the table to the container
        statsContainer.appendChild(table);

        // Append the stats container to the main container (where it should appear in the DOM)
        const container = document.querySelector("#stat-container");
        if (container) {
          container.appendChild(statsContainer);
        }
      })
      .catch((error) => {
        Alert.errorMessage(
          "User Stats",
          `Something went wrong: ${error.message}`
        );
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
        await TRequest.request("POST", "/api/avatar/upload/", formData);
        await Avatar.refreshAvatars();
      } catch (error) {
        Alert.errorMessage("Avatar", error.message);
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

        <div class="row p-3">
          <div class="row align-items-center">
            <div class="col-md-6">
              <img id="profile-img" src="${Avatar.url(
                this.currentUserInfos.id
              )}" width="300" height="300" data-avatar="${
        this.currentUserInfos.id
      }" alt="user" class="rounded-circle">
            </div>
            <div class="col-md-6">
              <h1 class="text-white display-1">${
                this.currentUserInfos.username
              }</h1>
              <p class="text-white display-5" id=nickname>${
                this.currentUserInfos.nickname
              }</p>
              ${
                this.currentUserInfos.id === Application.getUserInfos().userId
                  ? profileEdit
                  : ""
              }
              ${
                this.currentUserInfos.id === Application.getUserInfos().userId
                  ? profileAlias
                  : ""
              }
              ${
                this.currentUserInfos.id === Application.getUserInfos().userId
                  ? profileTwofa
                  : ""
              }
            </div>
            <div id="stat-container">
            </div>


          </div>
        </div>
      `;
    }
  }
}

export default ProfileView;
