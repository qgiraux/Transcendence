import Application from "./Application.js";
/**
 * @class TRequest
 * @brief Une classe qui sert d'exemple pour la documentation.
 * This class is destined to handle Transcendence https requests
 * protected by a JWT token.
 * If a request fails beacause of an expired token, an attempt to
 * refresh the toekn will be made.
 * The class must not be instantiated
 */
class TRequest {
  static canBeConvertedToJSON(value) {
    try {
      JSON.stringify(value);
      return true; // Si pas d'erreur, la conversion est possible
    } catch (error) {
      return false; // Si une erreur se produit, ce n'est pas convertible
    }
  }

  /**
   * Make a request to the route by
   * @param {string} method - The route
   * @param {string} route - The route
   * @param {object} body - The request body
   * @returns {object} request result
   */
  static async request(method, route, body) {
    let access = Application.getAccessToken();
    if (access === null) throw new Error("No access token");
    let fetchobj = {
      method: method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access}`,
      },
    };
    if (
      body !== undefined &&
      body !== null &&
      TRequest.canBeConvertedToJSON(body)
    ) {
      fetchobj.body = JSON.stringify(body);
      fetchobj.headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(route, fetchobj);
      if (!response.ok) {
        if (response.status == 401) {
          // let's try to refresh the token
          await TRequest.refreshToken();
          return TRequest.request(method, route, body);
        }
      }
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        return json;
      }
    } catch (error) {
      throw new Error(`TRequest: ${error}`);
    }
  }

  static async formRequest(method, route, form) {
    let access = Application.getAccessToken();
    if (access === null) throw new Error("No access token");
    let fetchobj = {
      method: method,
      headers: {
        Authorization: `Bearer ${access}`,
      },
      body: form,
    };

    try {
      const response = await fetch(route, fetchobj);
      if (!response.ok) {
        if (response.status == 401) {
          // let's try to refresh the token
          await TRequest.refreshToken();
          return TRequest.request(method, route, form);
        }
      }
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        return json;
      }
    } catch (error) {
      throw new Error(`TRequest: ${error}`);
    }
  }

  static async refreshToken() {
    const refresh = Application.getRefreshToken();
    if (refresh === null) throw new Error("No refresh token");

    const response = await fetch("/api/users/refresh/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      form: JSON.stringify({ refresh: Application.getRefreshToken() }),
    });
    if (!response.ok) {
      throw new Error("The server refused to refresh the token");
    }
    const json = await response.json();
    if (!Object.hasOwn(json, "access")) {
      throw new Error(`Invalid refresh token: ${JSON.stringify(json)}`);
    }
    Application.setAccessToken(json.access);
  }
}

export default TRequest;
