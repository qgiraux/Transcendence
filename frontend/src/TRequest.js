import Application from "./Application.js";
/**
 * @class TRequest
 * @brief Une classe qui sert d'exemple pour la documentation.
 * This class is destined to handle Transcendence https requests
 * protected by a JWT token.
 * If a request fails because of an expired token, an attempt to
 * refresh the token will be made.
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

  static containsToken(obj) {
    const searchTerm = "token";

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (
          key.toLowerCase().includes(searchTerm) ||
          (typeof value === "string" &&
            value.toLowerCase().includes(searchTerm))
        ) {
          return true;
        }

        if (typeof value === "object" && value !== null) {
          if (containsToken(value)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Make a request to the route by
   * @param {string} method - The HTTP method (GET, POST, etc.)
   * @param {string} route - The API route
   * @param {object} body - The request body (optional)
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
          const res = await response.json();
          if (
            TRequest.containsToken(res) // if it's a token related error
          ) {
            console.log("refresh case");
            // Token expired, try refreshing the token
            await TRequest.refreshToken();
            return TRequest.request(method, route, body);
          } else {
            console.log("else case");
            throw new Error(`Request failed with status: ${response.status}`);
          }
        } else {
          console.log("not ok for other reason case");
          throw new Error(`Request failed with status: ${response.status}`);
        }
      }

      const contentType = response.headers.get("Content-Type");

      if (contentType) {
        if (contentType.includes("application/json")) {
          const json = await response.json();
          return json;
        }

        if (contentType.includes("image/jpeg")) {
          const imageBlob = await response.blob();
          return imageBlob;
        }
        if (contentType.includes("text/plain")) {
          const text = await response.text();
          return text;
        }
        if (contentType.includes("text/html")) {
          const text = await response.text();
          const parser = new DOMParser();
          return parser.parseFromString(text, "text/html");
        }
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
      throw new Error(`TRequest: ${error.message}`);
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
}

export default TRequest;
