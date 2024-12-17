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
  static #lastUpdate = null;
  static DELTA_TIME = 60000;

  static url(userId) {
    const urlObj = Avatar.#uuidList.filter((obj) => {
      return obj.Userid === userId;
    });
    if (urlObj.length === 0) {
      return "/api/avatar/picture/default/";
    }
    return `/api/avatar/picture/${urlObj[0].uuid}/`;
  }
  static async getPictures() {
    /**
     * Update the src attribute
     * of all images with attribute data-avatar
     */
    const current = new Date();
    if (
      Avatar.#uuidList === null ||
      current.getTime() - Avatar.DELTA_TIME > Avatar.#lastUpdate.getTime()
    ) {
      try {
        const response = await TRequest.request(
          "GET",
          "/api/avatar/avatar_list/"
        );
        Avatar.#uuidList = response;
        Avatar.#lastUpdate = new Date();
      } catch (error) {
        Alert.errorMessage(
          "Error during avatar pictures retrieval",
          error.message
        );
      }
    }
    const avatarsImg = document.querySelectorAll("img[data-avatar]");
    avatarsImg.forEach((img) => {
      const userId = img.getAttribute("data-avatar");
      img.src = Avatar.url(Number(userId));
    });
  }
}

export default Avatar;
