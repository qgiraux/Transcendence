import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";

class FriendsView extends AbstractView {
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
    TRequest.request("GET", "/api/users/userlist/")
      .then((result) => {
        this.userList = result.filter((user) => {
          return user["id"] !== Application.getUserInfos().userId;
        });
      })
      .catch((error) => {
        Alert.errorMessage("Error", error.message);
      });
    this._setHtml();

    this._getFriendsList();

    this.addEventListener(
      document.querySelector("#searchInput"),
      "input",
      this._updateDropdown.bind(this)
    );

    this.addEventListener(
      document.querySelector("#dropdownMenu"),
      "click",
      this._dropDownClickHandler.bind(this)
    );

    this.addEventListener(
      document.querySelector("#add-friend-button"),
      "click",
      this._addFriend.bind(this)
    );
  }

  // safely removing focus form the modal when it closes - accessibility issue
  _modalSafeClose(event) {
    console.log(" "); // data race fun instruction
    document.getElementById("searchInput").focus();
  }

  _dropDownClickHandler(event) {
    event.stopPropagation();
    const dropDownMenu = document.querySelector("#dropdownMenu");
    const li = event.target.closest("li");
    if (li && dropDownMenu.contains(li)) {
      const userId = li.dataset.id;
      TRequest.request("GET", `/api/users/userinfo/${userId}`)
        .then((result) => {
          document.getElementById("UserSelectModalLabel").textContent =
            result.username;
          document.getElementById("modal-nickname").textContent =
            result.nickname;
          const modal = new bootstrap.Modal(
            document.getElementById("UserSelectModal")
          );
          this.addEventListener(
            document.getElementById("UserSelectModal"),
            "hidden.bs.modal",
            this._modalSafeClose.bind(this)
          );
          modal.show();
        })
        .catch((error) => {
          Alert.errorMessage("something went wrong", error.message);
        });
    }
  }

  _updateDropdown() {
    const searchInput = document.querySelector("#searchInput");
    const dropDownMenu = document.querySelector("#dropdownMenu");

    dropDownMenu.innerHTML = "";
    if (searchInput.value.length > 0) {
      const lowercaseValue = searchInput.value.toLowerCase();
      const filtered = this.userList.filter((user) => {
        return (
          user.username.toLowerCase().startsWith(lowercaseValue) ||
          user.nickname.toLowerCase().startsWith(lowercaseValue)
        );
      });

      filtered.forEach((user) => {
        const li = document.createElement("li");
        li.dataset.id = user["id"];
        li.innerHTML = `<a class="dropdown-item" style="max-width: 500px;" >
		<img src="img/avatar_placeholder.jpg" alt="hugenerd" width="40" height="40" class="rounded-circle">
		${user.username}</a>`;
        dropDownMenu.appendChild(li);
      });
    }
  }

  async _getFriendsList() {
    try {
      const friendsList = await TRequest.request(
        "GET",
        "/api/friends/friendslist/"
      );
      console.log("friends", friendsList);
    } catch (error) {
      Alert.errorMessage(
        "get Friends list : something went wrong",
        error.message
      );
    }
  }
  async _addFriend(id) {
    try {
      const request = await TRequest.request(
        "POST",
        "/api/friends/addfriend/",
        {
          id: id,
        }
      );
      if (request.message !== "Friend added successfully")
        throw new Error("error");
      this._getFriendsList();
    } catch (error) {
      Alert.errorMessage("something went wrong", error.message);
    }
  }

  _setHtml() {
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `

<!-- Modal -->
<div class="modal fade text-white" id="UserSelectModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog ">
    <div class="modal-content bg-dark">
      <div class="modal-header">
        <h5 class="modal-title" id="UserSelectModalLabel">User Details</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
		<img src="img/avatar_placeholder.jpg" alt="user" width="200" height="200" class="">
        <p id="modal-nickname">placeholder</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" id="add-friend-button">Add as a friend</button>
      </div>
    </div>
  </div>
</div>




<div class="row">
			<div class="col-12">
				<h1 class="text-white display-1">Friends</h1>
			</div>
		</div>
		<div class="row g-2  border border-secondary p-2 rounded" id="friends-container">
			<div class="col-md-4 col-lg-3" style="max-width: 150px;">
				<div class="card shadow  border-secondary p-2 fixed-width-card   text-white"
					style="background-color: #303030;">
					<img class="card-img-top  rounded" src="img/avatar_placeholder.jpg" alt="Card image cap">
					<div class="card-body">
						<h5 class="card-title my-0 mb-0" style="font-size: 0.9rem;font-weight: bold;">Nicolas The
							destructor
						</h5>
						<p class="card-text my-0 mb-0" style="font-size: 0.7rem;">(NicolasRea)</p>
						<span class="bg-success"></span>
						<p class="card-text  my-0 mb-0"
							style=" font-size: 0.8rem;font-weight: bold; color: rgb(0, 255, 149);">
							Online
						</p>
						<a href="#" class="text-primary my-0 mb-0" style=" font-size: 0.8rem;">View profile</a>
						<a href="#" class="text-danger my-0 mb-0" style=" font-size: 0.8rem;">Remove friend</a>
					</div>
				</div>
			</div>

			<div class="col-md-4 col-lg-3" style="max-width: 150px;">
				<div class="card shadow  border-secondary p-2 fixed-width-card   text-white"
					style="background-color: #303030;">
					<img class="card-img-top  rounded" src="img/avatar_placeholder.jpg" alt="Card image cap">
					<div class="card-body">
						<h5 class="card-title my-0 mb-0" style="font-size: 0.9rem;font-weight: bold;">Nicolas The
							destructor
						</h5>
						<p class="card-text my-0 mb-0" style="font-size: 0.7rem;">(NicolasRea)</p>
						<span class="bg-success"></span>
						<p class="card-text  my-0 mb-0"
							style=" font-size: 0.8rem;font-weight: bold; color: rgb(0, 255, 149);">
							Online
						</p>
						<a href="#" class="text-primary my-0 mb-0" style=" font-size: 0.8rem;">View profile</a>
						<a href="#" class="text-primary my-0 mb-0" style=" font-size: 0.8rem;">Invite to a game</a>
						<a href="#" class="text-danger my-0 mb-0" style=" font-size: 0.8rem;">Remove friend</a>
					</div>
				</div>
			</div>
			<div class="col-md-4 col-lg-3" style="max-width: 150px;">
				<div class="card shadow  border-secondary p-2 fixed-width-card   text-white"
					style="background-color: #303030;">
					<img class="card-img-top  rounded" src="img/avatar_placeholder.jpg" alt="Card image cap">
					<div class="card-body">
						<h5 class="card-title my-0 mb-0" style="font-size: 0.9rem;font-weight: bold;">Nicolas The
							destructor
						</h5>
						<p class="card-text my-0 mb-0" style="font-size: 0.7rem;">(NicolasRea)</p>
						<span class="bg-success"></span>
						<p class="card-text  my-0 mb-0"
							style=" font-size: 0.8rem;font-weight: bold; color: rgb(0, 255, 149);">
							Online
						</p>
						<a href="#" class="text-primary my-0 mb-0" style=" font-size: 0.8rem;">View profile</a>
						<a href="#" class="text-danger my-0 mb-0" style=" font-size: 0.8rem;">Remove friend</a>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col-12">
				<h3 class="text-white display-5 mt-5 mb-0">Still looking for a friend ?</h3>
			</div>


			<div class="row mt-0">
				<div class="col-9 mx-auto">
					<div class="container mt-5">
						<div class="dropdown" mx-auto>
							<input type="text" class="form-control" style="max-width: 500px;" id="searchInput"
								placeholder="Search a friend" data-bs-toggle="dropdown" aria-expanded="false" />
							<ul class="dropdown-menu w-100" id="dropdownMenu">
								<!-- Les options seront ajoutées ici dynamiquement -->
							</ul>
						</div>

					</div>
				</div>
			</div>


					`;
    }
  }
}

export default FriendsView;

/*
recuperer la liste des utilisateurs

		<div class="">
		<div class="card" style="width: 18rem;">
		<img class="card-img-top" src=".../100px180/" alt="Card image cap">
		<div class="card-body">
			<h5 class="card-title">Card title</h5>
			<p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
			<a href="#" class="btn btn-primary">Go somewhere</a>
		</div>
		</div>
		</div>
*/
