import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";

class FriendsView extends AbstractView {
  friendList = [];
  userList = [];
  constructor(params) {
    super(params);
    this.onStart();
  }

  onStart() {
    this._setTitle("Friends");
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }
    this._getFriendsList();
    TRequest.request("GET", "/api/users/userlist/")
      .then((result) => {
        this.userList = result;
      })
      .catch((error) => {
        Alert.errorMessage("Error", error.message);
      });

    this._setHtml();

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
          document.getElementById("UserSelectModal").dataset.id = userId;
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
    const searchList = this.userList
      .filter((user) => {
        return user["id"] !== Application.getUserInfos().userId;
      })
      .filter((user) => {
        return !this.friendList.includes(user["id"]);
      });
    dropDownMenu.innerHTML = "";
    if (searchInput.value.length > 0) {
      const lowercaseValue = searchInput.value.toLowerCase();
      const filtered = searchList.filter((user) => {
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
      this.friendList = friendsList.friends;
      this.displayFriendsList(friendsList.friends);
    } catch (error) {
      Alert.errorMessage(
        "get Friends list : something went wrong",
        error.message
      );
    }
  }

  addFriendCard(friend) {
    const friendsContainer = document.querySelector("#friends-container");
    const div = document.createElement("div");
    div.classList.add("col-md-4");
    div.classList.add("col-lg-3");
    div.style.maxWidth = " 160px";
    div.innerHTML = `
	<div class="col-md-4 col-lg-3 " style="width: 150px;">
		<div class="card shadow  border-secondary p-2 fixed-width-card   text-white"
		style="background-color: #303030;">
			<img class="card-img-top  rounded" src="img/avatar_placeholder.jpg" alt="Card image cap">
				<div class="card-body">
					<h5 class="card-title my-0 mb-0" style="font-size: 0.9rem;font-weight: bold;">
					${friend.username}'s nickname
					</h5>
					<p class="card-text my-0 mb-0" style="font-size: 0.7rem;">(${friend.username})</p>
					<span class="bg-success"></span>
					<div class="dropdown">
					<button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						Dropdown button
					</button>
					<div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
						<a class="dropdown-item" href="#">Action</a>
						<a class="dropdown-item" href="#">Another action</a>
						<a class="dropdown-item" href="#">Something else here</a>
					</div>
					</div>
					<p class="card-text  my-0 mb-0"
						style=" font-size: 0.8rem;font-weight: bold; color: rgb(0, 255, 149);">
						Online

				</div>
			</div>
	</div>`;
    friendsContainer.appendChild(div);
  }

  displayFriendsList(friendsList) {
    const friendsContainer = document.querySelector("#friends-container");
    friendsContainer.innerHTML = "";
    friendsList.forEach((friendId) => {
      const FriendInfo = TRequest.request(
        "GET",
        `/api/users/userinfo/${friendId}`
      )
        .then((result) => {
          this.addFriendCard(result);
        })
        .catch((error) => {
          Alert.errorMessage("displayFriendsList error", error.message);
        });
    });
  }

  async _addFriend(event) {
    try {
      const button = event.target;
      const modal = button.closest(".modal");
      if (!modal) {
        throw new Error("Modal not found");
      }
      const friendId = modal.getAttribute("data-id");
      if (!friendId) {
        throw new Error("data-id attribute not found on modal");
      }
      const request = await TRequest.request(
        "POST",
        "/api/friends/addfriend/",
        {
          id: friendId,
        }
      );
      if (request.message !== "Friend added successfully")
        throw new Error("The user couldn't be added as a friend");
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
        <button type="button" class="btn btn-primary" id="add-friend-button"  data-bs-dismiss="modal">Add as a friend</button>
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
