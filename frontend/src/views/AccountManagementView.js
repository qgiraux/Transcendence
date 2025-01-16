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
  }

  /*
Event handlers
*/
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

		<div class="mx-auto">
			<div class="row p-1 mb-4 ">
			<div class="row align-items-center">
				<div class="col-md-6">
					 <img id="profile-img" src="${Avatar.url(this.id)}"
					  width="300" height="300" data-avatar="${
              this.id
            }" alt="user" class="rounded-circle">
				</div>
				<div class="col-6 mb-3 p-2 ">
					<h1 class="text-primary display-1 " id="nickname">${
            Application.getUserInfos().nickname
          }</h1>
					<h2 class="text-secondary " id="username">@${
            Application.getUserInfos().userName
          }</h2>
					<!-- <div class="card bg-dark text-white p-4 rounded shadow"></div> -->
				</div>
			</div>
			<br>
		</div>

		<div class="row align-items-start">
			<h2 class="display-6 text-white ">Avatar</h2>
		</div>
		<div class="row p-1 mb-4 w-100 mw-100 mx-auto bg-dark text-white border border-secondary rounded container-md">
			<div class="">
				<div class="mt-3" id="avatar-radio">
					<div class="form-check">
						<input class="form-check-input" type="radio" name="avatarOption" id="resetDefault" value="reset"
							checked>
						<label class="form-check-label fs-5" for="resetDefault">Reset to Default</label>
					</div>
					<div class="form-check mb-3">
						<input class="form-check-input" type="radio" name="avatarOption" id="uploadFile" value="file">
						<label class="form-check-label fs-5" for="uploadFile">Choose from File</label>
						<div class="input-group mb-3">
							<div class="custom-file">
								<input type="file" class="custom-file-input" accept="image/png,image/jpeg"
									id="avatarInput" disabled>
							</div>
						</div>
						<button type="button" class="btn btn-primary fs-5" id="avatar-update-button"">Update
							Avatar</button>
					</div>
				</div>
			</div>
		</div>

		<div class="row align-items-start">
			<h2 class="display-6 text-white ">Alias</h2>
		</div>
		<div class="row p-1 mb-4 w-100 mw-100 mx-auto bg-dark text-white border border-secondary rounded container-md p-3">
		  	<div class="row mb-3">
			  <input type="text" class="form-control w-25" id="newAliasInput" minlength="1" maxlength="20"   placeholder="Enter new alias">
			  </div>
		  	<div class="row ">
			  <button type="button" class="btn btn-primary fs-5 w-25" id="alias-update-button">Update Alias</button>
			 </div>
		</div>

		<div class="row align-items-start">
			<h2 class="display-6 text-white ">Authentification</h2>
		</div>
		<div class="row p-1 mb-4 w-100 mw-100 mx-auto bg-dark text-white border border-secondary rounded container-md p-3">
		  	<div class="row mb-3">
			  <input type="password" class="form-control w-25" id="newPasswordInput1" minlength="1" maxlength="20"   placeholder="Enter new password">
			  </div>
			<div class="row mb-3">
			  <input type="password" class="form-control w-25" id="newPasswordInput2" minlength="1" maxlength="20"   placeholder="Enter new password">
			  </div>
		  	<div class="row ">
			  <button type="button" class="btn btn-primary fs-5 w-25" id="password-update-button">Update Password</button>
			 </div>
		</div>


		<div class="row align-items-start">
			<h2 class="display-6 text-danger ">Delete acount</h2>
		</div>
		<div class="row p-1 mb-4 w-100 mw-100 mx-auto bg-dark text-white border border-secondary rounded container-md p-3">
		  	<div class="mx-auto content-justify-center">
		  		<p class="text-danger">❗ This action is irreversible</p>
			</div>
		  	<div class="row mb-3">
			  <button type="button" class="btn btn-danger fs-5 w-25" id="alias-update-button">Delete account</button>
		</div>

</div>



	`;
  }
}
export default AccountManagementView;
