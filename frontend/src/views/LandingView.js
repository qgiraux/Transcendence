import AbstractView from "./AbstractView.js";
import Application from "../Application.js";
import Localization from "../Localization.js";
import Alert from "../Alert.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";

class LandingView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Login");

    this.domText = {};
    this.messages = {};
    this.init();
  }

  async init() {
    await Application.setLanguage(Application.lang);
    await this.loadMessages();
    Application.toggleLangSelectorShow();
    this.onStart();
  }

  async loadMessages() {
    await Application.applyTranslations();
    this.domText.loginLabel = await Application.localization.t(
      "landing.login.label"
    );
    this.domText.enterLoginField = await Application.localization.t(
      "landing.login.enterField"
    );
    this.domText.passwordLabel = await Application.localization.t(
      "landing.password.label"
    );
    this.domText.passwordField = await Application.localization.t(
      "landing.password.field"
    );
    this.domText.twofaLabel = await Application.localization.t(
      "landing.twofa.label"
    );
    this.domText.twofaField = await Application.localization.t(
      "landing.twofa.field"
    );
    this.domText.signInSubmit = await Application.localization.t(
      "landing.signin.submit"
    );
    this.domText.chooseLogin = await Application.localization.t(
      "landing.login.choose"
    );
    this.domText.choosePassword = await Application.localization.t(
      "landing.password.choose"
    );
    this.domText.confirmPassword = await Application.localization.t(
      "landing.password.confirm"
    );
    this.domText.signUpSubmit = await Application.localization.t(
      "landing.signup.submit"
    );
    this.messages.loginAlertTitle = await Application.localization.t(
      "landing.messages.loginErrorTitle"
    );
    this.messages.registerAlertTitle = await Application.localization.t(
      "landing.messages.registerErrorTitle"
    );
    this.messages.invalidCredentials = await Application.localization.t(
      "landing.messages.invalidCredentials"
    );
    this.messages.wrongCredentialsFormat = await Application.localization.t(
      "landing.messages.wrongCredentialsFormat"
    );
    this.messages.serverError = await Application.localization.t(
      "landing.messages.serverError"
    );
    this.messages.userAlreadyExist = await Application.localization.t(
      "landing.messages.userAlreadyExist"
    );
    this.messages.PasswordsDontMatch = await Application.localization.t(
      "landing.messages.passwordsDontMatch"
    );
  }

  onStart() {
    if (Application.getAccessToken() !== null) {
      setTimeout(() => {
        Router.reroute("/home");
      }, 50);
      return;
    }
    this.setHtml();
    const loginRadio = document.getElementById("loginradio");
    const createAccountRadio = document.getElementById("registerradio");
    this.addEventListener(loginRadio, "change", this._handleToggle.bind(this));
    this.addEventListener(
      createAccountRadio,
      "change",
      this._handleToggle.bind(this)
    );
    document.getElementById("register-form").style.display = "none";
  }

  _handleToggle(event) {
    event.stopPropagation();
    const loginRadio = document.getElementById("loginradio");
    const createAccountRadio = document.getElementById("registerradio");
    const loginButton = document.getElementById("login-btn");
    const registerButton = document.getElementById("register-btn");
    const register = document.getElementById("register-form");
    const login = document.getElementById("login-form");
    if (loginRadio.checked) {
      register.style.display = "none";
      login.style.display = "block";
      this.addEventListener(
        loginButton,
        "click",
        this._loginHandler.bind(this)
      );
      this.deleteEventListenerByElement(registerButton);
    } else if (createAccountRadio.checked) {
      login.style.display = "none";
      register.style.display = "block";
      this.addEventListener(
        registerButton,
        "click",
        this._registerHandler.bind(this)
      );
      this.deleteEventListenerByElement(loginButton);
    }
  }

  _validatePass(passwordValue) {
    const validatExpr = new RegExp(
      "^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$"
    );
    return validatExpr.test(passwordValue);
  }

  _validateLogin(loginValue) {
    const validatExpr = new RegExp("^[a-zA-Z0-9]{5,20}$");
    return validatExpr.test(loginValue);
  }

  _loginHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    const login = document.querySelector("#InputLogin");
    const password = document.querySelector("#InputPassword");
    this.loginRequest({
      username: login.value,
      password: password.value,
    });
  }

  async loginRequest(credentials) {
    try {
      const response = await fetch("/api/users/login/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        if (response.status === 401) {
          const message = await response.json();
          if (message["2FA"] !== undefined) {
            //A two factor authentification is needed
            //We get the token and transmit it to the TwofaLoginView
            const token = message["token"];
            if (token === undefined) throw new Error(this.messages.serverError);
            Router.reroute(`/twofalogin/${token}`);
            return;
          } else throw new Error(this.messages.invalidCredentials);
        } else {
          throw new Error(this.messages.serverError);
        }
      }

      const json = await response.json();
      Application.setToken(json);
      Application.setUserInfosFromToken();
      await Application.toggleSideBar();
      Application.toggleChat();
      Application.retrieveDBLang();
      Application.setLanguage(Application.lang);
      Router.reroute("/home");
    } catch (error) {
      Alert.errorMessage(this.messages.loginAlertTitle, error.message);
    }
  }

  _registerHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    const login = document.querySelector("#RegisterLogin");
    const password = document.querySelector("#RegisterPassword");
    const passwordConfirm = document.querySelector("#RegisterPasswordConfirm");
    if (
      this._validateLogin(login.value) &&
      this._validatePass(password.value)
    ) {
      if (password.value !== passwordConfirm.value) {
        Alert.errorMessage(
          this.messages.registerAlertTitle,
          this.messages.PasswordsDontMatch
        );
        return;
      }
      this.RegisterRequest({ username: login.value, password: password.value });
    } else {
      Alert.errorMessage(
        this.messages.registerAlertTitle,
        this.messages.wrongCredentialsFormat
      );
    }
  }

  async RegisterRequest(credentials) {
    try {
      const response = await fetch("/api/users/register/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      if (response.status !== 201) {
        switch (response.status) {
          case 400:
            throw new Error(this.messages.userAlreadyExist);
          case 500:
            throw new Error(this.messages.serverError);
          default:
            throw new Error(this.messages.serverError);
        }
      }
      this.loginRequest(credentials);
    } catch (error) {
      Alert.errorMessage(this.messages.registerAlertTitle, error.message);
    }
  }

  setHtml() {
    let pm = "";
    const container = document.querySelector("#view-container");
    if (container) {
      container.innerHTML = `
			<div class="row text-white ">
        <div class="col-10 mx-auto justify-content-center mb-5">
          <img src="/img/transcendence.webp" class="img-fluid" alt="Responsive image" id="landing-image">
        </div>
      </div>

      <div class="row " id="landing-page-form">
        <div class="col-6 mx-auto">
          <div class="btn-group d-flex text-center" role="group" aria-label="toggle login register">
            <input type="radio" class="btn-check" name="btnradio" id="loginradio" autocomplete="off" checked>
            <label class="btn btn-outline-primary btn-custom" for="loginradio">${this.domText.signInSubmit}</label>

            <input type="radio" class="btn-check" name="btnradio" id="registerradio" autocomplete="off">
            <label class="btn btn-outline-primary btn-custom" for="registerradio">${this.domText.signUpSubmit}</label>
          </div>
        </div>

        <div class="row " id="login-form">
          <div class="col-6 mx-auto mt-5">
            <form>
              <div class="form-group text-white ">
                <label for="InputLogin">${this.domText.loginLabel}</label>
                <input type="text" class="form-control" id="InputLogin" aria-describedby="emailHelp"
                  placeholder="${this.domText.enterLoginField}" autocomplete="username" required>

              </div>
              <div class="form-group text-white ">
                <label for="InputPassword">${this.domText.passwordLabel}</label>
                <input type="password" class="form-control" id="InputPassword" placeholder="${this.domText.passwordField}" autocomplete="current-password">
              </div>
              <div class="d-flex justify-content-center mt-3">
                <button id="login-btn" type="submit" class="btn btn-primary mt-3">${this.domText.signInSubmit}</button>
              </div>
            </form>
          </div>
        </div>

        <div class="row " id="register-form">
          <div class="col-6 mx-auto mt-5 ">
            <form>
              <div class="form-group text-white  ">
                <label for="RegisterLogin">${this.domText.loginLabel}</label>
                <input type="text" class="form-control" id="RegisterLogin" aria-describedby="login"
                  placeholder="${this.domText.chooseLogin}" autocomplete="username" required>

              </div>
              <div class="form-group text-white mt-2 ">
                <label for="RegisterPassword">${this.domText.passwordLabel}</label>
                <input type="password" class="form-control" id="RegisterPassword" placeholder="${this.domText.choosePassword}" autocomplete="new-password" required>
              </div>
              <div class="form-group text-white mt-2 ">
                <label for="RegisterPasswordConfirm">${this.domText.passwordLabel}</label>
                <input type="password" class="form-control" id="RegisterPasswordConfirm" placeholder="${this.domText.confirmPassword}" autocomplete="new-password" required>
              </div>
              <div class="d-flex justify-content-center mt-3">
                <button id="register-btn" type="submit" class="btn btn-primary mt-3">${this.domText.signUpSubmit}</button>
              </div>
            </form>

          </div>
        </div>
      </div>
`;
      this._handleToggle(new Event("change"));
    }
  }
}

export default LandingView;
