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

        Avatar.getUUid().then(() => {
          this._setHtml();
          const manageBtn = document.querySelector("#manage-btn");
          if (manageBtn) {
            this.addEventListener(
              manageBtn,
              "click",
              this._manageProfileClickHandler.bind(this)
            );
          }
          this.addEventListener(
            document.querySelector("#reset-profile-picture"),
            "click",
            this._resetAvatarHandler.bind(this)
          );

          this.addEventListener(
            document.getElementById("profileModal"),
            "hide.bs.modal",
            this._modalSafeClose.bind(this)
          );
        });
      })
      .catch((error) => {
        Alert.errorMessage("something went wrong", error.message);
      });
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

    const manageModal = new bootstrap.Modal(
      document.getElementById("profileModal")
    );
    manageModal.show();
  }

  _resetAvatarHandler(event) {
    event.stopPropagation();
    TRequest.request("DELETE", "/api/avatar/delete/").then(() => {
      Avatar.refreshAvatars();
    });
  }

  _setHtml() {
    const profileEdit = `
	<button class="btn btn-primary" id="manage-btn" >Manage profile</button>
	`;
    const container = document.querySelector("#view-container");

    if (container) {
      container.innerHTML = `

  <!-- Modal -->
<div class="modal fade text-white" id="profileModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content bg-dark">
            <div class="modal-header">
                <h2>Profile Settings</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="update-profile-form">
                    <div class="mb-3">
                        <h5 class="mb-3">Nickname</h5>
                        <div class="input-group">
                            <div class="col-xs-2">
                            <input type="text" class="form-control bg-dark text-white" id="nickname" name="nickname" placeholder= ${
                              this.currentUserInfos.nickname
                            } />
                            </div>
                            <button type="button" class="btn btn-primary" id="update-nickname">Update Nickname</button>
                        </div>
                    </div>

                    <h5 class="mb-3">Profile Picture</h5>
                    <div class="d-flex justify-content-between gap-2 mb-3">
                        <button type="button" class="btn btn-primary flex-fill" id="update-profile-picture">Update</button>
                        <button type="button" class="btn btn-warning flex-fill"   data-bs-dismiss="modal" id="reset-profile-picture">Reset</button>
                    </div>

                    <h5 class="mb-3">Account</h5>
                    <div class="text-center">
                        <button type="button" class="btn btn-danger" id="delete-account">Delete Account</button>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>





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
					`;
    }
  }
}

export default ProfileView;
