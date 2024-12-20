import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";

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
    const id = this.params["id"] || Application.getUserInfos().userId;
    TRequest.request("GET", `/api/users/userinfo/${id}`)
      .then((result) => {
        this.currentUserInfos = result;

        this._setHtml();
      })
      .catch((error) => {
        Alert.errorMessage("something went wrong", error.message);
      });
  }

  _setHtml() {
    const profileEdit = `
	<label class="btn btn-primary">
	Change Avatar picture
	<input type="file" class="form-control required d-none" id="file" name="file" ng-model="Form.file" required>
	</label>
	`;
	const profileTwofa = `
	<label class="btn btn-primary">
	Activate 2FA
	<a href="/twofa" data-link class="nav-link px-0 align-middle">profile</a>	</label>
	`;
    const container = document.querySelector("#view-container");

    if (container) {
      container.innerHTML = `




	  <div class="row p-3">
			<div class="col-3  mx-1 ">
				<img src="/img/avatar_placeholder.jpg" alt="user" class=" rounded-circle">
			</div>
		</div>


		<div class="row p-2 mb-0">
			<div class="col-3  mx-1 ">
				<h1 class="text-white display-2">${this.currentUserInfos.username}</h1>
			</div>
		</div>
		<div class="row p-2">
			<div class="col-3  mx-1 ">
				<h4 class="text-white ">${this.currentUserInfos.username}</h4>
			</div>
			<div class="row p-2">
				<div class="col-4  mx-1 ">
${
  this.currentUserInfos.id === Application.getUserInfos().userId
    ? profileEdit
    : ""
}
${
	this.currentUserInfos.id === Application.getUserInfos().userId
	  ? profileTwofa
	  : ""
  }
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
