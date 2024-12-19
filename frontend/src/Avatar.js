import TRequest from "./TRequest.js";
import Alert from "./Alert.js";

class Avatar {
  /**
   * The Avatar class
   * this class must not be instantiated
   * it stores and expose the method to
   * retrieve an url from an userId
   * getUrl(userId) for caching purposes
   *
   */
  static #uuidList = null;
  constructor() {
    throw new Error("Avatar classe can't be instantiated.");
  }

  static url(userId) {
    if (typeof userId !== Number) userId = Number(userId);
    const urlObj = Avatar.#uuidList.filter((obj) => {
      return obj.Userid === userId;
    });
    if (urlObj.length === 0) {
      return "/api/avatar/picture/default/";
    }
    return `/api/avatar/picture/${urlObj[0].uuid}/`;
  }

  static async getUUid() {
    /**
     *Get an update of he uuid/user_id list
     *from the Avatar service and refresh
     *the class attribute
     */

    try {
      const response = await TRequest.request(
        "GET",
        "/api/avatar/avatar_list/"
      );
      Avatar.#uuidList = response;
    } catch (error) {
      Alert.errorMessage(
        "Error during avatar pictures retrieval",
        error.message
      );
    }
  }

  static async refreshAvatars() {
    /**
     * Update the src attribute
     * of all images with attribute data-avatar
     */
    Avatar.getUUid();
    const avatarsImg = document.querySelectorAll("img[data-avatar]");
    avatarsImg.forEach((img) => {
      const userId = img.getAttribute("data-avatar");
      img.src = Avatar.url(userId);
    });
  }
}

export default Avatar;
