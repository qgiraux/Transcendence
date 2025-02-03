/**
 * @jest-environment jsdom
 */

import LandingView from "./LandingView.js";
import Application from "../Application.js";
import Alert from "../Alert.js";

// Mock dependencies
jest.mock("../Application.js", () => ({
  toggleSideBar: jest.fn(),
  setToken: jest.fn(),
  setUserInfosFromToken: jest.fn(),
  toggleChat: jest.fn(),
  openWebSocket: jest.fn(),
  reroute: jest.fn(),
}));
jest.mock("../Alert.js", () => ({
  errorMessage: jest.fn(),
}));

describe("LandingView", () => {
  let landingView;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="view-container"></div>
      <input type="radio" id="loginradio" name="btnradio" checked>
      <input type="radio" id="registerradio" name="btnradio">
      <div id="login-form"></div>
      <div id="register-form" style="display: none;"></div>
      <button id="login-btn"></button>
      <button id="register-btn"></button>
      <input id="InputLogin" />
      <input id="InputPassword" />
      <input id="RegisterLogin" />
      <input id="RegisterPassword" />
      <input id="RegisterPasswordConfirm" />
    `;

    landingView = new LandingView({});
  });

  test("_validateLogin should validate correct login", () => {
    expect(landingView._validateLogin("ValidUser123")).toBe(true);
    expect(landingView._validateLogin("ab")).toBe(false);
    expect(landingView._validateLogin("invalid_user_with_long_name")).toBe(
      false
    );
  });

  test("_validatePass should validate correct passwords", () => {
    expect(landingView._validatePass("Valid$Password1")).toBe(true);
    expect(landingView._validatePass("short")).toBe(false);
    expect(landingView._validatePass("NoSpecialChar1")).toBe(false);
  });

  test("_handleToggle should toggle forms based on radio button selection", () => {
    const loginRadio = document.getElementById("loginradio");
    const registerRadio = document.getElementById("registerradio");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    registerRadio.checked = true;
    landingView._handleToggle({ stopPropagation: jest.fn() });

    expect(registerForm.style.display).toBe("block");
    expect(loginForm.style.display).toBe("none");
  });

  test("_loginHandler should show error for invalid input", () => {
    const loginInput = document.getElementById("InputLogin");
    const passwordInput = document.getElementById("InputPassword");
    loginInput.value = "Invalid";
    passwordInput.value = "short";

    landingView._loginHandler({
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    });

    expect(Alert.errorMessage).toHaveBeenCalled();
  });

  test("loginRequest should call fetch with correct parameters", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: "123" }),
      })
    );

    await landingView.loginRequest({ username: "user", password: "pass" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/users/login/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "user", password: "pass" }),
      })
    );
    expect(Application.setToken).toHaveBeenCalledWith({ token: "123" });
  });
});
