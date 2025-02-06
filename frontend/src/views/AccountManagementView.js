import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";

class AccountManagementView extends AbstractView {
  constructor(params) {
    super(params);
    this.onStart();
  }
  onStart() {
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }

    /*
	View initialization
	*/
    this._setTitle("Account management");
    this.id = this.params["id"] || Application.getUserInfos().userId;

    this.avatarChoice = "reset";
    /*
        Localization placeholders
    */
    this.messages = {};
    this.messages.wrongCredentialsFormat = `You must provide a valid username and password.
		The login must contains only letters or digits and be between 5-20 characters long <br>
	   The password must be contains at least 8 characters and contains one digit,
	   one uppercase letter and at least one special character : !@#$%^&* `;

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
  }

  /*
Event handlers
*/

  navHandler(event) {
    event.preventDefault();
    event.stopPropagation();
	navButtons =
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

  setActiveView(viewName) {
    const cards = document.querySelectorAll(".setting-card");
    cards.forEach((card) => {
      if (!card.classList.contains("d-none")) card.classList.add("d-none");
    });

    const newCard = document.querySelector(`#${viewName}`);
    newCard.classList.remove("d-none");
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
            "Avatar",
            "The avatar picture has been updated successfully."
          );
        })
        .catch((error) => {
          Alert.errorMessage("Avatar reset", `Something went wrong: ${error}`);
        });
    } else if (this.avatarChoice === "update") {
      const fileInput = document.getElementById("avatarInput");
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
        Alert.classicMessage(
          "Avatar",
          "The avatar picture has been updated successfully."
        );
      } catch (error) {
        Alert.errorMessage(
          "Avatar",
          `The picture could't be uploaded.
            Please check that it is a valid jpeg or png file, less or equal than 5MB`
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
      Alert.errorMessage("Alias", "Alias cannot be empty.");
      return;
    }
    if (newAlias.length > 20) {
      Alert.errorMessage(
        "Alias",
        "Alias must be equal or less than 20 characters"
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

      Alert.classicMessage("Alias", "The alias has been updated successfully.");
      Router.reroute("/account");
    } catch (error) {
      Alert.errorMessage("Alias", `Failed to update alias: ${error.message}`);
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

  async passwordButtonHandler() {
    const input1 = document.querySelector("#newPasswordInput1");
    const input2 = document.querySelector("#newPasswordInput2");
    if (!input1 || !input2) {
      Alert.errorMessage("Password", "An error has occured");
      return;
    }
    if (!this._validatePass(input1.value)) {
      Alert.errorMessage("Password", this.messages.wrongCredentialsFormat);
      return;
    }
    if (input1.value !== input2.value) {
      Alert.errorMessage("Password", "Password fields must match");
    }
    Alert.errorMessage(
      "TODO",
      "TODO  route user_management pour changer password"
    );
  }

  _setHtml() {
    const viewContainer = document.getElementById("view-container");

    viewContainer.innerHTML = `
		<div style="max-width: 800px;" class="mx-auto w-75 mw-75 align-item-center p-2 ">
			<div class="row mx-auto">
				<h1>Account</h1>
			</div>



		<div class="row">
	<div class="col mt-2 align-items-center  p-2 mb-3 gap-4">
				<div class="col-3 ">
					<img id="profile-img" src="${Avatar.url(
            this.id
          )}" width="150" height="150" data-avatar=${
      Application.getUserInfos().userId
    } alt="user"
						class="rounded-circle">
				</div>
				</div>

			<div class="col mx-auto">
				<h2 class="text-primary display-5" id="nickname">${
          Application.getUserInfos().nickname
        }</h2>
				<h4 class="text-secondary" id="username">@${
          Application.getUserInfos().userName
        }</h4>
			</div>

				</div>


				<div class="row mb-2">
					<div class=" btn-group mx-auto align-items-center">
						<button id="nav-avatar" data-status="1" class="btn btn-primary active">Change Avatar</button>
						<button id="nav-alias" data-status="2" class="btn btn-primary">Change Alias</button>
						<button id="nav-password" data-status="2" class="btn btn-primary">Change password</button>
						<button id="nav-twofa" data-status="2" class="btn btn-primary">Manage Twofa</button>
						<button id="nav-delete" data-status="2" class="btn btn-primary">Delete account</button>
					</div>
				</div>
			<div class=" row mx-auto p-2" style="max-width:800px;" id="scrollable-panel">


				<!-- Avatar Card -->
				<div class="setting-card row w-75 mw-75 mx-auto  text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center"
					id="avatar">
					<div class="row align-items-start w-100">
						<h2 class="display-6 text-white fw-bold text-center w-100">Avatar</h2>
					</div>
					<div class="row mt-3 w-100" id="avatar-radio">
						<div class="form-check mx-auto">
							<input class="form-check-input" type="radio" name="avatarOption" id="resetDefault"
								value="reset" checked="">
							<label class="form-check-label fs-5" for="resetDefault">Reset to Default</label>
						</div>
						<div class="form-check mb-3 mx-auto">
							<input class="form-check-input" type="radio" name="avatarOption" id="uploadFile"
								value="file">
							<label class="form-check-label fs-5" for="uploadFile">Choose from File</label>
							<div class="input-group mb-3 mx-auto" style="max-width: 300px;">
								<input type="file" class="form-control" accept="image/png,image/jpeg" id="avatarInput"
									disabled="">
							</div>
							<button type="button" class="btn btn-primary fs-5" id="avatar-update-button"
								style="width: 200px;">Update Avatar</button>
						</div>
					</div>
				</div>

				<!-- Alias Card -->
				<div class="setting-card row  w-75 mw-75 mx-auto  text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center d-none"
					id="alias">
					<div class="row align-items-start w-100">
						<h2 class="display-6 text-white fw-bold text-center w-100">Alias</h2>
					</div>
					<div class="row mb-3 w-100">
						<input type="text" class="form-control mx-auto" id="newAliasInput" minlength="1" maxlength="20"
							placeholder="Enter new alias" style="max-width: 300px;">
					</div>
					<div class="row w-100">
						<button type="button" class="btn btn-primary fs-5 mx-auto" id="alias-update-button"
							style="width: 200px;">Update Alias</button>
					</div>
				</div>

				<!-- password Card -->
				<div class="setting-card row w-75 mw-75 mx-auto  text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center d-none"
					id="password">
					<div class="row align-items-start w-100">
						<h2 class="display-6 text-white fw-bold text-center w-100">Password</h2>
					</div>
					<div class="row align-items-center w-100">
						<h2 class="text-white fs-4 text-center w-100">Change password</h2>
						<div class="row mb-3 w-100">
							<input type="password" class="form-control mx-auto" id="oldpasswordinput" minlength="1"
								maxlength="20" placeholder="Enter old password" style="max-width: 300px;">
						</div>
						<div class="row mb-3 w-100">
							<input type="password" class="form-control mx-auto" id="newPasswordInput1" minlength="1"
								maxlength="20" placeholder="Enter new password" style="max-width: 300px;">
						</div>
						<div class="row mb-3 w-100">
							<input type="password" class="form-control mx-auto" id="newPasswordInput2" minlength="1"
								maxlength="20" placeholder="Enter new password" style="max-width: 300px;">
						</div>
						<div class="row w-100">
							<button type="button" class="btn btn-primary fs-5 mx-auto" id="password-update-button"
								style="width: 200px;">Update Password</button>
						</div>
					</div>
				</div>
	</div>`;
    // 		<!-- Authentication Card -->
    // 		<div class="setting-card row  w-75 mw-75 mx-auto bg-dark text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center d-none"
    // 			id="auth">
    // 			<div class="row align-items-start w-100">
    // 				<h2 class="display-6 text-white fw-bold text-center w-100">Double Authentification</h2>
    // 			</div>
    // 			<div class="row align-items-center w-100">
    // 				<h2 class="text-white fs-4 text-center w-100">Change password</h2>
    // 				<div class="row mb-3 w-100">
    // 					<input type="password" class="form-control mx-auto" id="oldpasswordinput" minlength="1"
    // 						maxlength="20" placeholder="Enter old password" style="max-width: 300px;">
    // 				</div>
    // 				<div class="row mb-3 w-100">
    // 					<input type="password" class="form-control mx-auto" id="newPasswordInput1" minlength="1"
    // 						maxlength="20" placeholder="Enter new password" style="max-width: 300px;">
    // 				</div>
    // 				<div class="row mb-3 w-100">
    // 					<input type="password" class="form-control mx-auto" id="newPasswordInput2" minlength="1"
    // 						maxlength="20" placeholder="Enter new password" style="max-width: 300px;">
    // 				</div>
    // 				<div class="row w-100">
    // 					<button type="button" class="btn btn-primary fs-5 mx-auto" id="password-update-button"
    // 						style="width: 200px;">Update Password</button>
    // 				</div>
    // 			</div>
    // 		</div>

    // 		<!-- Delete Account Card -->
    // 		<div class="setting-card row  w-75 mw-75 mx-auto bg-dark text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center d-none"
    // 			id="delete">
    // 			<div class="row align-items-start w-100">
    // 				<h2 class="display-6 text-danger fw-bold text-center w-100">Delete account</h2>
    // 			</div>
    // 			<div class="mx-auto text-center">
    // 				<p class="text-danger">❗ This action is irreversible</p>
    // 			</div>
    // 			<div class="row w-100">
    // 				<button type="button" class="btn btn-danger fs-5 mx-auto" style="width: 200px;">Delete
    // 					Account</button>
    // 			</div>
    // 		</div>

    // 	</div>

    // </div>

    //     viewContainer.innerHTML = `

    // <div style="max-width: 800px;" class="  mx-auto w-75 mw-75 align-item-center ">
    // 	<div class="row p-1 mb-4 ">
    // 	<div class="row align-items-start">
    // 		<div class="col-md-6">
    // 				<img id="profile-img" src="${Avatar.url(this.id)}"
    // 				width="300" height="300" data-avatar="${
    //           this.id
    //         }" alt="user" class="rounded-circle">
    // 		</div>
    // 		<div class="col-6 mb-3 p-2 ">
    // 			<h1 class="text-primary display-1 " id="nickname">${
    //         Application.getUserInfos().nickname
    //       }</h1>
    // 			<h2 class="text-secondary " id="username">@${
    //         Application.getUserInfos().userName
    //       }</h2>
    // 		</div>
    // 	</div>

    // 			<!-- Navigation Card -->
    // 	<div class="row mb-4 w-75 mw-75 mx-auto bg-dark text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center">

    // 	<div class="list-group">
    // 	<a href="#avatar" class="list-group-item list-group-item-action bg-dark text-white">Change my profile picture</a>
    // 	<a href="#alias" class="list-group-item list-group-item-action bg-dark text-white">Change my alias</a>
    // 	<a href="#auth" class="list-group-item list-group-item-action bg-dark text-white">Change my password</a>
    // 	<a href="#auth" class="list-group-item list-group-item-action bg-dark text-white">Manage Double authentification</a>
    // 	<a href="#delete" class="list-group-item list-group-item-action bg-dark text-white">Delete my account</a>
    // 	</div>
    // 	</div>

    // 	<div class="mx-auto wh-100" style="max-width:800px;" id="scrollable-panel">

    // 		<!-- Avatar Card -->
    // 		<div class="row mb-4 w-75 mw-75 mx-auto bg-dark text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center" id="avatar">
    // 			<div class="row align-items-start w-100">
    // 				<h2 class="display-6 text-white fw-bold text-center w-100">Avatar</h2>
    // 			</div>
    // 			<div class="row mt-3 w-100" id="avatar-radio">
    // 				<div class="form-check mx-auto">
    // 					<input class="form-check-input" type="radio" name="avatarOption" id="resetDefault" value="reset" checked>
    // 					<label class="form-check-label fs-5" for="resetDefault">Reset to Default</label>
    // 				</div>
    // 				<div class="form-check mb-3 mx-auto">
    // 					<input class="form-check-input" type="radio" name="avatarOption" id="uploadFile" value="file">
    // 					<label class="form-check-label fs-5" for="uploadFile">Choose from File</label>
    // 					<div class="input-group mb-3 mx-auto" style="max-width: 300px;">
    // 						<input type="file" class="form-control" accept="image/png,image/jpeg" id="avatarInput" disabled>
    // 					</div>
    // 					<button type="button" class="btn btn-primary fs-5" id="avatar-update-button" style="width: 200px;">Update Avatar</button>
    // 				</div>
    // 			</div>
    // 		</div>

    // 		<!-- Alias Card -->
    // 		<div class="row mb-4 w-75 mw-75 mx-auto bg-dark text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center" id="alias">
    // 			<div class="row align-items-start w-100">
    // 				<h2 class="display-6 text-white fw-bold text-center w-100">Alias</h2>
    // 			</div>
    // 			<div class="row mb-3 w-100">
    // 				<input type="text" class="form-control mx-auto" id="newAliasInput" minlength="1" maxlength="20" placeholder="Enter new alias" style="max-width: 300px;">
    // 			</div>
    // 			<div class="row w-100">
    // 				<button type="button" class="btn btn-primary fs-5 mx-auto" id="alias-update-button" style="width: 200px;">Update Alias</button>
    // 			</div>
    // 		</div>

    // 		<!-- password Card -->
    // 		<div class="row mb-4 w-75 mw-75 mx-auto bg-dark text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center" id="password">
    // 			<div class="row align-items-start w-100">
    // 				<h2 class="display-6 text-white fw-bold text-center w-100">Password</h2>
    // 			</div>
    // 			<div class="row align-items-center w-100">
    // 				<h2 class="text-white fs-4 text-center w-100">Change password</h2>
    // 				<div class="row mb-3 w-100">
    // 					<input type="password" class="form-control mx-auto" id="oldpasswordinput" minlength="1" maxlength="20" placeholder="Enter old password" style="max-width: 300px;">
    // 				</div>
    // 				<div class="row mb-3 w-100">
    // 					<input type="password" class="form-control mx-auto" id="newPasswordInput1" minlength="1" maxlength="20" placeholder="Enter new password" style="max-width: 300px;">
    // 				</div>
    // 				<div class="row mb-3 w-100">
    // 					<input type="password" class="form-control mx-auto" id="newPasswordInput2" minlength="1" maxlength="20" placeholder="Enter new password" style="max-width: 300px;">
    // 				</div>
    // 				<div class="row w-100">
    // 					<button type="button" class="btn btn-primary fs-5 mx-auto" id="password-update-button" style="width: 200px;">Update Password</button>
    // 				</div>
    // 			</div>
    // 		</div>

    // 		<!-- Authentication Card -->
    // 		<div class="row mb-4 w-75 mw-75 mx-auto bg-dark text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center" id="auth">
    // 			<div class="row align-items-start w-100">
    // 				<h2 class="display-6 text-white fw-bold text-center w-100">Double Authentification</h2>
    // 			</div>
    // 			<div class="row align-items-center w-100">
    // 				<h2 class="text-white fs-4 text-center w-100">Change password</h2>
    // 				<div class="row mb-3 w-100">
    // 					<input type="password" class="form-control mx-auto" id="oldpasswordinput" minlength="1" maxlength="20" placeholder="Enter old password" style="max-width: 300px;">
    // 				</div>
    // 				<div class="row mb-3 w-100">
    // 					<input type="password" class="form-control mx-auto" id="newPasswordInput1" minlength="1" maxlength="20" placeholder="Enter new password" style="max-width: 300px;">
    // 				</div>
    // 				<div class="row mb-3 w-100">
    // 					<input type="password" class="form-control mx-auto" id="newPasswordInput2" minlength="1" maxlength="20" placeholder="Enter new password" style="max-width: 300px;">
    // 				</div>
    // 				<div class="row w-100">
    // 					<button type="button" class="btn btn-primary fs-5 mx-auto" id="password-update-button" style="width: 200px;">Update Password</button>
    // 				</div>
    // 			</div>
    // 		</div>

    // 		<!-- Delete Account Card -->
    // 		<div class="row mb-4 w-75 mw-75 mx-auto bg-dark text-white border border-secondary rounded container-md p-3 d-flex flex-column align-items-center" id="delete">
    // 			<div class="row align-items-start w-100">
    // 				<h2 class="display-6 text-danger fw-bold text-center w-100">Delete account</h2>
    // 			</div>
    // 			<div class="mx-auto text-center">
    // 				<p class="text-danger">❗ This action is irreversible</p>
    // 			</div>
    // 			<div class="row w-100">
    // 				<button type="button" class="btn btn-danger fs-5 mx-auto" style="width: 200px;">Delete Account</button>
    // 			</div>
    // 		</div>

    // 				</div>

    // 	</div>

    // </div>

    // 	`;
  }
}
export default AccountManagementView;
