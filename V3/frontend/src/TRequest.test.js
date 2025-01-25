import TRequest from "./TRequest.js";
import Application from "./Application.js";

global.FormData = class FormData {
  constructor() {
    this.data = {};
  }
  append(key, value) {
    this.data[key] = value;
  }
};
// Mock de la classe Application
jest.mock("./Application");

describe("TRequest", () => {
  beforeEach(() => {
    global.fetch = jest.fn(); // Mock global de fetch
    jest.clearAllMocks(); // Réinitialiser les mocks avant chaque test
  });

  describe("canBeConvertedToJSON", () => {
    it("devrait retourner true pour un objet valide", () => {
      expect(TRequest.canBeConvertedToJSON({ key: "value" })).toBe(true);
    });

    it("devrait retourner false pour un objet non sérialisable", () => {
      const circularObj = {};
      circularObj.self = circularObj;
      expect(TRequest.canBeConvertedToJSON(circularObj)).toBe(false);
    });
  });

  describe("request", () => {
    it("devrait effectuer une requête avec succès", async () => {
      Application.getAccessToken.mockReturnValue("validAccessToken");

      const mockResponse = { data: "success" };
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: jest.fn().mockReturnValue("application/json") },
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await TRequest.request("GET", "/api/test");

      expect(fetch).toHaveBeenCalledWith("/api/test", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer validAccessToken",
        },
      });

      expect(result).toEqual(mockResponse);
    });

    it("devrait lancer une erreur si aucun token d'accès n'est disponible", async () => {
      Application.getAccessToken.mockReturnValue(null);

      await expect(TRequest.request("GET", "/api/test")).rejects.toThrow(
        "No access token"
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it("devrait traiter une réponse de type text/plain", async () => {
      Application.getAccessToken.mockReturnValue("validAccessToken");

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: jest.fn().mockReturnValue("text/plain") },
        text: jest.fn().mockResolvedValueOnce("plain text response"),
      });

      const result = await TRequest.request("GET", "/api/test");

      expect(result).toEqual("plain text response");
    });
  });
});
