/**

 */
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

  constructor() {
    throw new Error("Application class must not be instantiated.");
  }
  static setToken(newtoken) {
    // voir pour modifier code de verification
    if (
      !Object.hasOwn(newtoken, "access") ||
      !Object.hasOwn(newtoken, "refresh")
    )
      throw "invalid token";
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
}
export default Application;
