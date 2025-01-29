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
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Make a request to the route by
   * @param {string} method - The HTTP method (GET, POST, etc.)
   * @param {string} route - The API route
   * @param {object} body - The request body (optional) : json or multipart form data
   * @param {bool} refreshed - This param is hidden and must not be used
   * @returns {object} request result
   */
  static async request(method, route, body, refreshed = false) {
    if (Application.checkAccessTokenValidity() === false) {
      await Application.refreshToken();
    }

    let access = Application.getAccessToken();
    if (access === null) throw new Error("No access token");
    let fetchobj = {
      method: method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access}`,
      },
    };
    if (body !== undefined && body !== null) {
      /// let's determine the body type : FormData or Json
      if (body instanceof FormData) {
        fetchobj.body = body;
      } else if (TRequest.canBeConvertedToJSON(body)) {
        fetchobj.body = JSON.stringify(body);
        fetchobj.headers["Content-Type"] = "application/json";
      } else {
        throw new Error(
          "The provided body is not a stringify object or a form data"
        );
      }
    }

    try {
      const response = await fetch(route, fetchobj);
      const contentType = response.headers.get("Content-Type");
      if (!response.ok) {
        if (
          response.status === 401 &&
          !refreshed &&
          contentType &&
          contentType.includes("application/json")
        ) {
          const json = await response.json();
          if (json["detail"] === "Given token not valid for any token type") {
          } else {
            throw new Error(`Request failed with status: ${response.status}`);
          }
          // let's try to refresh the token
          await Application.refreshToken();
          return TRequest.request(method, route, body, true);
        } else {
          throw new Error(`Request failed with status: ${response.status}`);
        }
      }

      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        return json;
      }
      if (contentType && contentType.includes("text/plain")) {
        const text = await response.text();
        return text;
      }
      if (contentType && contentType.includes("text/html")) {
        const text = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(text, "text/html");
      } else {
        const blob = await response.blob();
        return blob;
      }
    } catch (error) {
      throw new Error(`TRequest: ${error.message}`);
    }
  }
}

export default TRequest;
