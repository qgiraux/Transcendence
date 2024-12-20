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
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
    };

    if (body !== undefined && body !== null) {
      fetchobj.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(route, fetchobj);
      if (!response.ok) {
        if (response.status == 401) {
          // Token expired, try refreshing the token
          await TRequest.refreshToken();
          return TRequest.request(method, route, body);
        } else {
          throw new Error(`Request failed with status: ${response.status}`);
        }
      }

      const contentType = response.headers.get("Content-Type");

      // If the response is JSON, parse and return it
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        return json;
      }

      // If the response is a PNG image or other binary data, handle it as a Blob
      if (contentType && contentType.includes("image/png")) {
        const imageBlob = await response.blob();
        return imageBlob;  // Return the Blob object
      }

      // You can add other content types here if needed, for example, for PDF or other files

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
