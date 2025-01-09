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

  describe("refreshToken", () => {
    it("devrait rafraîchir le token avec succès", async () => {
      Application.getRefreshToken.mockReturnValue("validRefreshToken");
      Application.setAccessToken.mockImplementation(() => {});

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ access: "newAccessToken" }),
      });

      await TRequest.refreshToken();

      expect(fetch).toHaveBeenCalledWith("/api/users/refresh/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: "validRefreshToken" }),
      });

      expect(Application.setAccessToken).toHaveBeenCalledWith("newAccessToken");
    });

    it("devrait lancer une erreur si aucun token de rafraîchissement n'est disponible", async () => {
      Application.getRefreshToken.mockReturnValue(null);

      await expect(TRequest.refreshToken()).rejects.toThrow("No refresh token");
      expect(fetch).not.toHaveBeenCalled();
    });

    it("devrait lancer une erreur si le serveur refuse de rafraîchir le token", async () => {
      Application.getRefreshToken.mockReturnValue("invalidRefreshToken");

      fetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn(),
      });

      await expect(TRequest.refreshToken()).rejects.toThrow(
        "The server refused to refresh the token"
      );

      expect(fetch).toHaveBeenCalledTimes(1);
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

    it("devrait relancer une requête après avoir rafraîchi le token", async () => {
      Application.getAccessToken
        .mockReturnValueOnce("expiredAccessToken") // Token expiré initialement
        .mockReturnValueOnce("newAccessToken"); // Nouveau token après refresh
      Application.getRefreshToken.mockReturnValue("validRefreshToken");
      Application.setAccessToken.mockImplementation(() => {});

      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest.fn().mockResolvedValueOnce({
            detail: "Given token not valid for any token type",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({ access: "newAccessToken" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: jest.fn().mockReturnValue("application/json") },
          json: jest.fn().mockResolvedValueOnce({ data: "success" }),
        });

      const result = await TRequest.request("GET", "/api/test");

      expect(fetch).toHaveBeenCalledTimes(3); // Requête initiale, refresh, nouvelle requête
      expect(result).toEqual({ data: "success" });
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
