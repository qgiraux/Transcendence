/**

 */
import Avatar from "./Avatar.js";
import Localization from "./Localization.js";


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
    nickname: null,
  };
  static mainSocket = null;
  static gameSocket = null;
  static lang = "en-us";
  static localization = new Localization(Application.lang);
  static translationsCache = {};

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

  static deleteAccessToken() {
    Application.#token = null;
  }

  static deleteRefreshToken() {
    Application.#token = null;
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
        Application.#userInfos.nickname = token.payload.nickname;
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
  //Check if the access token stored in the Application class has not expired.
  // return Bool
  static checkAccessTokenValidity() {
    if (Application.#token.access === null) return false;
    try {
      const access = Application.#_parseToken(Application.#token.access);
      if (access.payload.exp <= Math.floor(Date.now() / 1000)) return false;
      return true;
    } catch (error) {
      return false;
    }
  }
  //try to refresh the JWT token. Throw an Error() if the refreshing did not succeed
  static async refreshToken() {
    const refresh = Application.getRefreshToken();
    if (refresh === null) throw new Error("No refresh token");

    const response = await fetch("/api/users/refresh/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: Application.getRefreshToken() }),
    });

    if (!response.ok) {
      throw new Error("The server refused to refresh the token");
    }

    const json = await response.json();
    if (!json.access) {
      throw new Error(`Invalid refresh token: ${JSON.stringify(json)}`);
    }
    Application.setAccessToken(json.access);
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
    console.log(Application.mainSocket);
    return Application.mainSocket;
  }

  static openGameSocket(url) {
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
    Application.gameSocket = new WebSocket(fullpath);

    // Add event listeners for debugging
    Application.gameSocket.onopen = () => {
      console.log("WebSocket connection opened:", fullpath);
    };
    Application.gameSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    Application.gameSocket.onclose = () => {
      console.log("WebSocket connection closed.");
    };
    console.log(Application.gameSocket);
    return Application.gameSocket;
  }

  static toggleSideBar() {
    const sideBar = document.querySelector("#sidebar");
    const avatarImg = document.querySelector("#side-img");
    const userId = Application.getUserInfos().userId;
    // document.querySelector("#side-username").textContent =
    //   Application.getUserInfos().userName;
    avatarImg.setAttribute("data-avatar", userId);
    Avatar.refreshAvatars().then(() => {
      sideBar.classList.remove("d-none");
    });
  }

  static toggleChat() {
    const chatBox = document.querySelector("#chat-btn");
    chatBox.classList.remove("d-none");
  }

  static async loadLocalization() {
    await Application.localization.loadTranslations();
  }

  static async setLanguage(lang) {
    Application.lang = lang;
    await Application.localization.setLanguage(lang);
    await this.localization.loadTranslations();
    await Application.applyTranslations();
  }
  static async applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(async (el) => {
      const translationKey = el.getAttribute("data-i18n");
      const translation = await Application.localization.t(translationKey);
      if (translation) {
        el.textContent = translation;
      }
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(async (el) => {
      const translationKey = el.getAttribute("data-i18n-placeholder");
      const translation = await Application.localization.t(translationKey);
      if (translation) {
        el.placeholder = translation;
      }
    });
  }
  
}



export default Application;
