import TRequest from "./TRequest.js";
import Application from "./Application.js";

jest.mock("./Application"); // Mock de la classe Application

describe("TRequest", () => {
  beforeEach(() => {
    global.fetch = jest.fn(); // Mock global de fetch
    jest.clearAllMocks(); // Nettoyer les mocks après chaque test
  });
  ///nTEST 1---------------------------------------------------------------------------

  it("TRequest test 1 devrait effectuer une requête avec succès", async () => {
    // Simuler un token d'accès valide
    Application.getAccessToken.mockReturnValue("validAccessToken");

    // Simuler une réponse réussie
    const mockResponse = { data: "success" };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await TRequest.request("GET", "/api/test", null);

    expect(fetch).toHaveBeenCalledWith("/api/test", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer validAccessToken",
      },
    });
    expect(result).toEqual(mockResponse);
  });
  ///nTEST 2---------------------------------------------------------------------------

  it("TRequest test 2  devrait rafraîchir le token et relancer la requête après une erreur 401", async () => {
    // Simuler un token d'accès invalide initialement
    Application.getAccessToken.mockReturnValueOnce(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    );

    // Simuler un token rafraîchi
    Application.getAccessToken.mockReturnValueOnce(
      "eyJhbGciOiJIsN5EMVVspjDbGIeETWDLXbYMKgoVSUQPxk"
    );
    Application.getRefreshToken.mockReturnValue("validRefreshToken");
    Application.setAccessToken.mockImplementation(() => {});

    // Simuler une réponse 401, suivie d'un succès après le rafraîchissement
    fetch
      .mockResolvedValueOnce({ ok: false, status: 401, json: jest.fn() }) // 401
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ access: "newAccessToken" }),
      }); // Succès

    // Simuler une réponse réussie pour le refresh
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ access: "newAccessToken" }),
    });

    const result = await TRequest.request("GET", "/api/test", null);

    expect(fetch).toHaveBeenCalledTimes(3); // Une fois pour la requête initiale, une fois pour le refresh, une fois pour la relance
    expect(result).toEqual({ access: "newAccessToken" });
  });

  ///nTEST 3---------------------------------------------------------------------------

  it("TRequest test 3  devrait lancer une erreur si le jeton de rafraîchissement est invalide", async () => {
    Application.getAccessToken.mockReturnValue("expiredAccessToken");
    Application.getRefreshToken.mockReturnValue("invalidRefreshToken");

    // Simuler une réponse 401 et une erreur pour le refresh
    fetch
      .mockResolvedValueOnce({ ok: false, status: 401, json: jest.fn() }) // 401
      .mockResolvedValueOnce({ ok: false, status: 400, json: jest.fn() }); // Erreur de refresh

    await expect(TRequest.request("GET", "/api/test", null)).rejects.toThrow(
      "TRequest: Error: The server refused to refresh the token"
    );

    expect(fetch).toHaveBeenCalledTimes(2); // Une fois pour la requête initiale, une fois pour le refresh
  });

  ///nTEST 4---------------------------------------------------------------------------

  it("TRequest test 4  devrait lancer une erreur si aucun token d'accès n'est disponible", async () => {
    Application.getAccessToken.mockReturnValue(null);

    await expect(TRequest.request("GET", "/api/test", null)).rejects.toThrow(
      "No access token"
    );

    expect(fetch).not.toHaveBeenCalled(); // Aucune requête fetch ne devrait être lancée
  });

  it("TRequest test 5  devrait lancer une erreur si aucun token de rafraîchissement n'est disponible", async () => {
    Application.getAccessToken.mockReturnValue("expiredAccessToken");
    Application.getRefreshToken.mockReturnValue(null);

    await expect(TRequest.refreshToken()).rejects.toThrow("No refresh token");

    expect(fetch).not.toHaveBeenCalled(); // Aucune requête fetch ne devrait être lancée
  });
});
