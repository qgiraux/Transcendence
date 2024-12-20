/**

 */
import Avatar from "./Avatar.js";

class Application {
  /**
   * A placeholder class, I'm not really sure for what
   * it will be used. It's not supposed to be instantiated but instead
   * give access to useful methods and store the JWT token and some infos for the views
   */
  static #token = null;
  static #userInfos = {
    userId: null,
    userName: null,
  };
  static mainSocket = null;

  constructor() {
    throw new Error("Application class must not be instantiated.");
  }
  static setToken(newtoken) {
    if (
      !Object.hasOwn(newtoken, "access") ||
      !Object.hasOwn(newtoken, "refresh")
    )
      throw `invalid token: ${newtoken}`;
    try {
      const access = Application.#_parseToken(newtoken.access);
      if (access.header.typ !== "JWT")
        throw new Error("Application.setToken : token is not JWT");
      Application.#_parseToken(newtoken.refresh);
      Application.#token = newtoken;
    } catch (error) {
      throw new Error(`Failed to parse and store the token: ${error}`);
    }
  }

  static setAccessToken(newAccesstoken) {
    Application.#token.access = newAccesstoken;
  }

  static getAccessToken() {
    if (Application.#token !== null) return Application.#token.access;
    return null;
  }

  static getRefreshToken() {
    if (Application.#token !== null) return Application.#token.refresh;
    return null;
  }

  static setUserInfos() {
    if (Application.#token !== null) {
      try {
        const token = Application.#_parseToken(Application.#token.access);
        Application.#userInfos.userId = token.payload.user_id;
        Application.#userInfos.userName = token.payload.username;
      } catch (error) {
        console.error(`Application: Error during userInfos setting : ${error}`);
      }
    }
  }

  static getUserInfos() {
    return Application.#userInfos;
  }

  static #_parseToken(token) {
    let HeaderBase64Url = token.split(".")[0];
    let PayloadBase64Url = token.split(".")[1];
    let HeaderBase64 = HeaderBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    let PayloadBase64 = PayloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    let jsonPayload = decodeURIComponent(
      window
        .atob(PayloadBase64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    let jsonHeader = decodeURIComponent(
      window
        .atob(HeaderBase64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return {
      header: JSON.parse(jsonHeader),
      payload: JSON.parse(jsonPayload),
    };
  }
  static openWebSocket(url) {
    if (Application.#token === null) {
      // Correct the check
      console.error(
        `Application: Error opening WebSocket: user not identified`
      );
      return null;
    }
    if (!url) {
      console.error("WebSocket URL must be provided.");
      return null;
    }
    const fullpath = `${url}?token=${Application.getAccessToken()}`; // Fix token retrieval
    Application.mainSocket = new WebSocket(fullpath);

    // Add event listeners for debugging
    Application.mainSocket.onopen = () => {
      console.log("WebSocket connection opened:", fullpath);
    };
    Application.mainSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    Application.mainSocket.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return Application.mainSocket;
  }

  static toggleSideBar() {
    const sideBar = document.querySelector("#sidebar");
    const avatarImg = document.querySelector("#side-img");
    console.log(avatarImg);
    const userId = Application.getUserInfos().userId;
    console.log(userId, "userId");
    document.querySelector("#side-username").textContent =
      Application.getUserInfos().userName;
    avatarImg.setAttribute("data-avatar", userId);
    Avatar.refreshAvatars().then(() => {
      sideBar.classList.toggle("d-none");
    });
  }

  static toggleChat() {
    const chatBox = document.querySelector("#chat-btn");
    chatBox.classList.toggle("d-none");
  }
}

export default Application;
