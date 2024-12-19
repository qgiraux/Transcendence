/**
 * @jest-environment jsdom
 */

import Avatar from "./Avatar.js";
import TRequest from "./TRequest.js";
import Alert from "./Alert.js";

jest.mock("./TRequest.js");
jest.mock("./Alert.js");

describe("Avatar Class", () => {
  beforeEach(() => {
    // Reset the mock data before each test
    Avatar.uuidList = null; // Simulate private reset
    jest.clearAllMocks();
  });

  test("Avatar class cannot be instantiated", () => {
    expect(() => {
      new Avatar();
    }).toThrow("Avatar class can't be instantiated.");
  });

  describe("url(userId)", () => {
    test("Returns default URL if userId is not found", () => {
      // Mock the UUID list
      Avatar.uuidList = [{ Userid: 123, uuid: "abc-123" }];
      expect(Avatar.url(456)).toBe("/api/avatar/picture/default/");
    });

    test("Returns the correct URL if userId is found", () => {
      Avatar.uuidList = [{ Userid: 123, uuid: "abc-123" }];
      expect(Avatar.url(123)).toBe("/api/avatar/picture/abc-123/");
    });

    test("Converts userId to a number if it's not already", () => {
      Avatar.uuidList = [{ Userid: 123, uuid: "abc-123" }];
      expect(Avatar.url("123")).toBe("/api/avatar/picture/abc-123/");
    });
  });

  describe("getUUid()", () => {
    test("Fetches and updates the UUID list successfully", async () => {
      const mockResponse = [
        { Userid: 123, uuid: "abc-123" },
        { Userid: 456, uuid: "def-456" },
      ];
      TRequest.request.mockResolvedValue(mockResponse);

      await Avatar.getUUid();
      expect(TRequest.request).toHaveBeenCalledWith(
        "GET",
        "/api/avatar/avatar_list/"
      );
      expect(Avatar.uuidList).toEqual(mockResponse);
    });

    test("Handles errors during UUID retrieval", async () => {
      TRequest.request.mockRejectedValue(new Error("Network Error"));

      await Avatar.getUUid();
      expect(Alert.errorMessage).toHaveBeenCalledWith(
        "Error during avatar pictures retrieval",
        "Network Error"
      );
    });
  });

  describe("refreshAvatars()", () => {
    test("Updates image `src` attributes correctly", async () => {
      Avatar.uuidList = [
        { Userid: 123, uuid: "abc-123" },
        { Userid: 456, uuid: "def-456" },
      ];

      // Mock the DOM structure
      document.body.innerHTML = `
        <img data-avatar="123" />
        <img data-avatar="456" />
        <img data-avatar="789" />
      `;

      await Avatar.refreshAvatars();

      const images = document.querySelectorAll("img[data-avatar]");
      expect(images[0].src).toContain("/api/avatar/picture/abc-123/");
      expect(images[1].src).toContain("/api/avatar/picture/def-456/");
      expect(images[2].src).toContain("/api/avatar/picture/default/");
    });
  });
});
