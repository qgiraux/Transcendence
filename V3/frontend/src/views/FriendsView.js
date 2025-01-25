import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";

class FriendsView extends AbstractView {
  friendList = [];
  userList = [];
  constructor(params) {
    super(params);
    this.domText = {};
    this.messages = {};
    this.init();
  }

  async init() {
    await this.loadMessages();
    this.onStart();
  }

  async loadMessages() {
    // await Application.loadLocalization();
    // await Application.setLanguage("fr-fr"); // for testing purposes
    // console.log("OK");
    this.domText.Title = await Application.localization.t("titles.friends");
    this.domText.viewProfile = await Application.localization.t("friends.card.viewProfile");
    this.domText.inviteGame = await Application.localization.t("friends.card.inviteGame");
    this.domText.unfriend = await Application.localization.t("friends.card.unfriend");
    this.domText.lookingForTxt = await Application.localization.t("friends.looking:for.text");
    this.domText.lookingForField = await Application.localization.t("friends.looking:for.field");
    this.domText.addFriendAction = await Application.localization.t("friends.add.action");
    this.domText.close = await Application.localization.t("friends.close");
    this.messages.error = await Application.localization.t("friends.errors.general");
    this.messages.wentWrong = await Application.localization.t("friends.errors.unexpected");
    this.messages.getFriendsErr = await Application.localization.t("friends.errors.list.get");
    this.messages.displayFriendsErr = await Application.localization.t("friends.errors.list.display");
    this.messages.modalNotFound = await Application.localization.t("friends.errors.modal.notFound");
    this.messages.idAttributeNotFound = await Application.localization.t("friends.errors.modal.idAttributeMissing");
    this.messages.addFriendSuccess = await Application.localization.t("friends.add.success");
    this.messages.addFriendFailure = await Application.localization.t("friends.add.failure");
    this.messages.removeFriendFailure = await Application.localization.t("friends.remove.failure");
  }

  onStart() {
    this._setTitle("Friends");
    if (Application.getAccessToken() === null) {
      setTimeout(() => {
        Router.reroute("/landing");
      }, 50);
      return;
    }
    Avatar.getUUid();
    TRequest.request("GET", "/api/users/userlist/")
      .then((result) => {
        this.userList = result;
        this._refreshFriendsList();
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
      document.querySelector("#searchInput"),
      "click",
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

    this.addEventListener(
      document.querySelector("#friends-container"),
      "click",
      this._friendDropDownhandler.bind(this)
    );

    this.addEventListener(
      document.getElementById("UserSelectModal"),
      "hide.bs.modal",
      this._modalSafeClose.bind(this)
    );
  }

  // safely removing focus form the modal when it closes - accessibility issue
  _modalSafeClose(event) {
    setTimeout(() => {
      const search = document.getElementById("searchInput");
      search.value = "";
      search.focus();
    }, 10);
  }

  async _friendDropDownhandler(event) {
    const target = event.target;
    if (target.matches(".dropdown-item[data-action]")) {
      const action = target.getAttribute("data-action");
      const id = target.getAttribute("data-id");

      switch (action) {
        case "view-profile":
          Router.reroute(`/profile/${id}`);
          break;
        case "invite-game":
          Router.reroute(`/tournaments`);
          break;
        case "unfriend":
          this._removeFriend(id);
          break;
        default:
          console.warn(`Unknown action: ${action} for ID : ${id}`);
      }
    }
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
          const modalImg = document.getElementById("modal-img");
          modalImg.dataset.avatar = userId;
          modalImg.src = Avatar.url(userId);
          modal.show();
        })
        .catch((error) => {
          Alert.errorMessage(this.messages.wentWrong, error.message);
        });
    }
  }

  _updateDropdown() {
    const searchInput = document.querySelector("#searchInput");
    const dropDownMenu = document.querySelector("#dropdownMenu");
    let filtered = [];
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
      filtered = searchList.filter((user) => {
        return (
          user.username.toLowerCase().startsWith(lowercaseValue) ||
          user.nickname.toLowerCase().startsWith(lowercaseValue)
        );
      });
    } else {
      filtered = searchList.filter((user) => {
        return !this.friendList.includes(user.id);
      });
    }
    filtered.forEach((user) => {
      const li = document.createElement("li");
      li.dataset.id = user["id"];
      li.innerHTML = `<a class="dropdown-item" style="max-width: 500px;" >
			<img data-avatar="${user["id"]}" src="${Avatar.url(
        user["id"]
      )}" alt="hugenerd" width="40" height="40" class="rounded-circle">
			${user.username}</a>`;
      dropDownMenu.appendChild(li);
    });
  }

  async _refreshFriendsList() {
    try {
      const friendsList = await TRequest.request(
        "GET",
        "/api/friends/friendslist/"
      );
      this.friendList = friendsList.friends;
      this.displayFriendsList(this.friendList);
    } catch (error) {
      Alert.errorMessage(
        this.messages.getFriends,error.message);
    }
  }

  async displayFriendsList(friendsList) {
    const friendsContainer = document.querySelector("#friends-container");
    friendsContainer.innerHTML = "";

    try {
      const friendPromises = friendsList.map((friendId) =>
        TRequest.request("GET", `/api/users/userinfo/${friendId}`)
      );
      const friendsInfos = await Promise.all(friendPromises);
      friendsInfos.forEach((friend) => {
        this.addFriendCard(friend);
      });
    } catch (error) {
      Alert.errorMessage(this.messages.displayFriendsErr, error.message)
    }
  }


  addFriendCard(friend) {
    const friendsContainer = document.querySelector("#friends-container");
    const div = document.createElement("div");
    div.classList.add("col-md-4", "col-lg-3");
    div.style.maxWidth = "160px";
  
    // HTML for the card - updated on Jan 24th to add localization
    div.innerHTML = `
	<div class="col-md-4 col-lg-3 " style="width: 150px;">
		<div class="card shadow  border-secondary p-2 fixed-width-card   text-white"
		style="background-color: #303030;">
			<img class="card-img-top rounded" src="${Avatar.url(
        friend.id
      )}" alt="Card image cap">
				<div class="card-body">
					<h5 class="card-title my-0 mb-0" style="font-size: 0.9rem;font-weight: bold;">
					${friend.nickname}
					</h5>
					<p class="card-text my-0 mb-0" style="font-size: 0.7rem;">(${
            friend.username
          })</p>

					<div class="btn-group">
					<button  style=" font-size: 0.8rem;font-weight: bold; color: rgb(0, 255, 149);"
					class="btn btn-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown"
					aria-expanded="false">
					Online
					</button>
					<ul class="dropdown-menu">
					<li><button class="dropdown-item" data-id=${
            friend.id
          } data-action="view-profile">${this.domText.viewProfile}</button></li>
                    <li><button class="dropdown-item" data-id=${
                      friend.id
                    } data-action="invite-game">${this.domText.inviteGame}</button></li>
                    <li><button class="dropdown-item" data-id=${
                      friend.id
                    } data-action="unfriend">${this.domText.unfriend}</button></li>
					</ul>
					</div>
				</div>
			</div>
	</div>`;
    friendsContainer.appendChild(div);
  
    // Asynchronously fetch the friend's status
    const statusElement = document.getElementById(`status-${friend.id}`);
    console.log("Checking status for friend ", friend.id);
    TRequest.request("GET", `/api/users/userstatus/${friend.id}`)
      .then((result) => {
        console.log("resuls is ", result)
        if (result.online === 1) {
          statusElement.style.color = "rgb(0, 255, 149)";
          statusElement.textContent = "Online";
        } else {
          statusElement.style.color = "rgb(255, 0, 0)";
          statusElement.textContent = "Offline";
        }
      })
      .catch((error) => {
        console.error("Error fetching status:", error);
        statusElement.textContent = "Error";
        statusElement.style.color = "orange";
      });
  }
  

  async _addFriend(event) {
    try {
      const button = event.target;
      const modal = button.closest(".modal");
      if (!modal) {
        throw new Error(this.messages.modalNotFound); // AV
      }
      const friendId = modal.getAttribute("data-id");
      if (!friendId) {
        throw new Error(this.messages.idAttributeNotFound); //AV
      }
      const request = await TRequest.request(
        "POST",
        "/api/friends/addfriend/",
        {
          id: friendId,
        }
      );
      if (request.message !== "Friend added successfully")
        throw new Error(this.messages.addFriendFailure);
      await this._refreshFriendsList();
    } catch (error) {
      Alert.errorMessage(this.messages.wentWrong, error.message);
    }
  }

  async _removeFriend(friendId) {
    try {
      await TRequest.request("DELETE", "/api/friends/removefriend/", {
        id: friendId,
      });
      this._refreshFriendsList();
    } catch (error) {
      Alert.errorMessage(this.messages.removeFriendFailure, error.message);
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
		<img id="modal-img" src="" alt="user" width="200" height="200" class="">
        <p id="modal-nickname">placeholder</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${this.domText.close}</button>
        <button type="button" class="btn btn-primary" id="add-friend-button"  data-bs-dismiss="modal">${this.domText.addFriendAction}</button>
      </div>
    </div>
  </div>
</div>


<div class="row">
			<div class="col-12">
				<h1 class="text-white display-1">${this.domText.Title}</h1>
			</div>
		</div>
		<div class="row g-2  border border-secondary p-2 rounded" id="friends-container">
		</div>

		<div class="row">
			<div class="col-12">
				<h3 class="text-white display-5 mt-5 mb-0">${this.domText.lookingForTxt}</h3>
			</div>
			<div class="row mt-0">
				<div class="col-9 mx-auto">
					<div class="container mt-5">
						<div class="dropdown" mx-auto>
							<input type="text" class="form-control" style="max-width: 500px;" id="searchInput"
								placeholder="${this.domText.lookingForField}" data-bs-toggle="dropdown" aria-expanded="false" />
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
