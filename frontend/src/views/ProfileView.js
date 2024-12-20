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
          const manageBtn = document.querySelector("#manage-btn");
          if (manageBtn) {
            this.addEventListener(
              manageBtn,
              "click",
              this._manageProfileClickHandler.bind(this)
            );
          }
          const modal = document.getElementById("avatarModal");
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
          this.avatarChoice = "reset";

          this.addEventListener(
            document.querySelector("#update-button"),
            "click",
            this._avatarButtonHandler.bind(this)
          );
        });
      })
      .catch((error) => {
        Alert.errorMessage("something went wrong", error.message);
      });
  }

  async _avatarButtonHandler(event) {
    event.stopPropagation();
    if (this.avatarChoice === "reset") {
      TRequest.request("DELETE", "/api/avatar/delete/")
        .then(() => {
          Avatar.refreshAvatars();
        })
        .catch(() => {
          Alert.errorMessage("Avatar reset", `something went wrong ${e}`);
        });
      const focusedElement = document.activeElement;

      const ancestorWithAriaHidden = focusedElement.closest(
        '[aria-hidden="true"]'
      );
    } else if (this.avatarChoice === "update") {
      const fileInput = document.getElementById("fileInput");
      if (fileInput.files.length === 0) {
        Alert.errorMessage("Avatar", "You must select a file");
        return;
      }
      const formData = new FormData();
      formData.append("image", fileInput.files[0]);
      try {
        const response = await TRequest.formRequest(
          "POST",
          "/api/avatar/upload/",
          formData
        );
        await Avatar.refreshAvatars();
      } catch (error) {
        Alert.errorMessage("Avatar", error.message);
      }
    }
  }

  _avataRadioHandler(event) {
    event.stopPropagation();
    if (event.target.name === "avatarOption") {
      const fileInput = document.querySelector("#fileInput");
      if (event.target.value === "reset") {
        this.avatarChoice = "reset";
        fileInput.disabled = true;
      } else if (event.target.value === "file") {
        this.avatarChoice = "update";
        fileInput.disabled = false;
      }
    }
  }

  // safely removing focus form the modal when it closes - accessibility issue
  _modalSafeClose(event) {
    setTimeout(() => {
      const img = document.getElementById("profile-img");
      img.focus();
    }, 10);
  }

  _manageProfileClickHandler(event) {
    event.stopPropagation();

    const avatarModal = new bootstrap.Modal(
      document.getElementById("avatarModal")
    );
    avatarModal.show();
  }

  _setHtml() {
    const profileEdit = `
	<button class="btn btn-primary" id="manage-btn" >Manage Avatar</button>
	`;
    const container = document.querySelector("#view-container");

    if (container) {
      container.innerHTML = `
      <!-- Modal -->
        <div class="modal fade text-white" id="avatarModal" tabindex="-1" aria-labelledby="exampleModalLabel"
            aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content bg-dark">
                    <div class="modal-header">
                        <h2>Avatar Settings</h2>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="mt-3">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="avatarOption" id="resetDefault"
                                value="reset" checked>
                            <label class="form-check-label" for="resetDefault">
                                Reset to Default
                            </label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="avatarOption" id="uploadFile"
                                value="file">
                            <label class="form-check-label" for="uploadFile">
                                Choose from File
                            </label>
                            <div class="input-group mb-3" >
                                <div class="custom-file">
                                    <input type="file" class="custom-file-input" accept="image/png,image/jpeg" id="fileInput" disabled>
                                </div>
                            </div>
                        </div>
                        </form>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="update-button"  data-bs-dismiss="modal">Update</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END MODAL -->

        <div class="row p-3">
            <div class="row align-items-center">
                <!-- Colonne pour l'image -->
                <div class="col-md-6">
                    <img id="profile-img" src="${Avatar.url(
                      this.currentUserInfos.id
                    )}" width="300" height="300" data-avatar="${
        this.currentUserInfos.id
      }" alt="user" class=" rounded-circle">
                </div>
                <!-- Colonne pour les informations -->
                <div class="col-md-6">
                    <h1 class="text-white display-1">${
                      this.currentUserInfos.username
                    }</h1>
                    <p class="text-white display-5">${
                      this.currentUserInfos.nickname
                    }</p>
                    ${
                      this.currentUserInfos.id ===
                      Application.getUserInfos().userId
                        ? profileEdit
                        : ""
                    }
                </div>
            </div>

        </div>
        <div class="row p-3">
            <div class="col-12">
                <table class="table table-dark ">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">First</th>
                            <th scope="col">Last</th>
                            <th scope="col">Handle</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">1</th>
                            <td>Mark</td>
                            <td>Otto</td>
                            <td>@mdo</td>
                        </tr>
                        <tr>
                            <th scope="row">2</th>
                            <td>Jacob</td>
                            <td>Thornton</td>
                            <td>@fat</td>
                        </tr>
                        <tr>
                            <th scope="row">3</th>
                            <td>Larry</td>
                            <td>the Bird</td>
                            <td>@twitter</td>
                        </tr>
                    </tbody>
                </table>

            </div>
        </div>
    </div>
					`;
    }
  }
}

export default ProfileView;
