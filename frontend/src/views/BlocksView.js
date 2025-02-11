import AbstractView from "./AbstractView.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";
import Application from "../Application.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";

class BlocksView extends AbstractView {
  blockList = [];
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
    this.domText.Title = await Application.localization.t("titles.block");
    this.domText.viewProfile = await Application.localization.t(
      "block.card.viewProfile"
    );
    this.domText.inviteGame = await Application.localization.t(
      "block.card.inviteGame"
    );
    this.domText.unblock = await Application.localization.t(
      "block.card.unblock"
    );
    this.domText.lookingForTxt = await Application.localization.t(
      "block.lookingFor.text"
    );
    this.domText.lookingForField = await Application.localization.t(
      "block.lookingFor.field"
    );
    this.domText.addBlockAction = await Application.localization.t(
      "block.add.action"
    );
    this.domText.close = await Application.localization.t("block.close");

    this.messages.error = await Application.localization.t(
      "block.errors.general"
    );
    this.messages.wentWrong = await Application.localization.t(
      "block.errors.somethingWentWrong"
    );
    this.messages.getBlockErr = await Application.localization.t(
      "block.errors.getBlockList"
    );
    this.messages.displayBlocksList = await Application.localization.t(
      "block.errors.displayBlockList"
    );
    this.messages.modalNotFound = await Application.localization.t(
      "block.errors.modalNotFound"
    );
    this.messages.idAttributeNotFound = await Application.localization.t(
      "block.errors.idAttributeNotFound"
    );
    this.messages.addBlockFailure = await Application.localization.t(
      "block.errors.addBlockFailure"
    );
    this.messages.removeBlockFailure = await Application.localization.t(
      "block.remove.failure"
    );
    this.messages.addBlockSuccess = await Application.localization.t(
      "block.success.addBlock"
    );
  }


  onStart() {
    this._setTitle("Blocks");
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
        this._refreshBlocksList();
      })
      .catch((error) => {
        Alert.errorMessage(this.messages.error, error.message);
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
      document.querySelector("#add-block-button"),
      "click",
      this._addBlock.bind(this)
    );

    this.addEventListener(
      document.querySelector("#blocks-container"),
      "click",
      this._blockDropDownhandler.bind(this)
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

  async _blockDropDownhandler(event) {
    const target = event.target;
    if (target.matches(".dropdown-item[data-action]")) {
      const action = target.getAttribute("data-action");
      const id = target.getAttribute("data-id");

      switch (action) {
        case "view-profile":
          Router.reroute(`/profile/${id}`);
          break;
        case "invite-game":
          console.log(`placeHolder Inviting to a game for ID: ${id}`);
          break;
        case "unblock":
          this._removeBlock(id);
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
        return !this.blockList.includes(user["id"]);
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
        return !this.blockList.includes(user.id);
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

  async _refreshBlocksList() {
    try {
      const blocksList = await TRequest.request(
        "GET",
        "/api/friends/blocks/blockslist/"
      );
      this.blockList = blocksList.blocks;
      this.displayBlocksList(this.blockList);
    } catch (error) {
      Alert.errorMessage(this.messages.getBlockErr, error.message);
    }
  }

  async displayBlocksList(blocksList) {
    const blocksContainer = document.querySelector("#blocks-container");
    blocksContainer.innerHTML = "";

    try {
      const blockPromises = blocksList.map((blockId) =>
        TRequest.request("GET", `/api/users/userinfo/${blockId}`)
      );
      const blocksInfos = await Promise.all(blockPromises);
      blocksInfos.forEach((block) => {
        this.addBlockCard(block);
      });
    } catch (error) {
      Alert.errorMessage(this.messages.displayBlocksList, error.message);
    }
  }

  addBlockCard(block) {
    const blocksContainer = document.querySelector("#blocks-container");
    const div = document.createElement("div");
    div.classList.add("col-md-4");
    div.classList.add("col-lg-3");
    div.style.maxWidth = "160px";
    div.innerHTML = `
    <div class="col-md-4 col-lg-3 " style="width: 150px;">
      <div class="card shadow border-secondary p-2 fixed-width-card text-white" style="background-color: #303030;">
        <img class="card-img-top rounded" src="${Avatar.url(block.id)}" alt="Card image cap">
        <div class="card-body">
          <h5 class="card-title my-0 mb-0" style="font-size: 0.9rem;font-weight: bold;">
            ${block.nickname}
          </h5>
          <p class="card-text my-0 mb-0" style="font-size: 0.7rem;">(${block.username})</p>
          <button style="font-size: 0.8rem; font-weight: bold; color: rgb(255, 0, 0);"
            class="btn btn-secondary btn-sm" data-id="${block.id}" data-action="unblock">
            ${this.domText.unblock}
          </button>
        </div>
      </div>
    </div>`;
    blocksContainer.appendChild(div);
  }

  async _addBlock(event) {
    try {
      const button = event.target;
      const modal = button.closest(".modal");
      if (!modal) {
        throw new Error(this.messages.modalNotFound);
      }
      const blockId = modal.getAttribute("data-id");
      if (!blockId) {
        throw new Error(this.messages.idAttributeNotFound);
      }
      const request = await TRequest.request(
        "POST",
        "/api/friends/blocks/addblock/",
        {
          id: blockId,
        }
      );
      if (request.message !== "Block added successfully")
        throw new Error(this.messages.addBlockFailure);
      await this._refreshBlocksList();
    } catch (error) {
      Alert.errorMessage(this.messages.wentWrong, error.message);
    }
  }

  async _removeBlock(blockId) {
    try {
      await TRequest.request("DELETE", "/api/friends/blocks/removeblock/", {
        id: blockId,
      });
      this._refreshBlocksList();
    } catch (error) {
      Alert.errorMessage(this.messages.removeBlockFailure, error.message);
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
        <button type="button" class="btn btn-primary" id="add-block-button"  data-bs-dismiss="modal">${this.domText.addBlockAction}</button>
      </div>
    </div>
  </div>
</div>


<div class="row">
			<div class="col-12">
				<h1 class="text-white display-1">${this.domText.Title}</h1>
			</div>
		</div>
		<div class="row g-2  p-2" id="blocks-container">
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

export default BlocksView;
