import AbstractView from "./AbstractView.js";
import Application from "../Application.js";
import Alert from "../Alert.js";
import Router from "../Router.js";

class LandingView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Login");
    this.onStart();
  }

  onStart() {
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
    this.addEventListener(
      document.getElementById("login-btn"),
      "click",
      this._loginHandler.bind(this)
    );
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
      "^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$"
    );
    return validatExpr.test(passwordValue);
  }

  _validateLogin(loginValue) {
    const validatExpr = new RegExp("^[a-zA-Z0-9]+$");
    return validatExpr.test(loginValue);
  }

  _toggleHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    Application.toggleSideBar();
  }

  _loginHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    const login = document.querySelector("#InputLogin");
    const password = document.querySelector("#InputPassword");
    if (
      this._validateLogin(login.value) &&
      this._validatePass(password.value)
    ) {
      this.loginRequest({ username: login.value, password: password.value });
    } else {
      Alert.errorMessage(
        "You must provide a valid username and password.",
        `The login must contains only letters or digits and be at least 8 characters long <br>
		 The password must be contains at least 8 characters and contains one digit,
		 one uppercase letter and one special character !@#$%^&* `
      );
    }
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
      const json = await response.json();
      if (!response.ok) {
        Alert.errorMessage("Login error", "Invalid user or password");
        return;
      }
      Application.setToken(json);
      Application.setUserInfos();
      Application.toggleSideBar();
      Application.toggleChat();
      Application.openWebSocket("wss://localhost:5000/ws/chat/")
      Router.reroute("/home");
    } catch (error) {
      Alert.errorMessage("Login error", "Connexion issue");
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
      password.value === passwordConfirm.value &&
      this._validatePass(password.value)
    ) {
      this.RegisterRequest({ username: login.value, password: password.value });
    } else {
      Alert.errorMessage(
        "Error",
        " You must provide a valid username and password"
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
        throw new Error(`Response status: ${response.status}`);
      }
      this.loginRequest(credentials);
    } catch (error) {
      Alert.errorMessage("register error", error.message);
    }
  }

  setHtml() {
    let pm = "";
    const container = document.querySelector("#view-container");
    for (const key in this.params) {
      pm += String(key) + " : " + this.params[key] + "<br>";
    }
    if (container) {
      container.innerHTML = `
			<div class="row text-white ">
			<div class="col-10 mx-auto justify-content-center mb-5">
				<img src="/img/transcendence.webp" class="img-fluid" alt="Responsive image">
			</div>

		</div>
		<div class="row text-white ">
			<div class="col-6 mx-auto">
				<div class="btn-group d-flex text-center" role="group" aria-label="toggle login register">
					<input type="radio" class="btn-check" name="btnradio" id="loginradio" autocomplete="off" checked>
					<label class="btn btn-outline-primary btn-custom" for="loginradio"> Login</label>

					<input type="radio" class="btn-check" name="btnradio" id="registerradio" autocomplete="off">
					<label class="btn btn-outline-primary btn-custom" for="registerradio">Create an account</label>
				</div>
			</div>

		</div>

		<div class="row " id="login-form">
			<div class="col-6 mx-auto mt-5">
				<form>
					<div class="form-group text-white ">
						<label for="InputLogin">Login</label>
						<input type="text" class="form-control" id="InputLogin" aria-describedby="emailHelp"
							placeholder="Enter login" required>

					</div>
					<div class="form-group text-white ">
						<label for="InputPassword">Password</label>
						<input type="password" class="form-control" id="InputPassword" placeholder="Password required">
					</div>
					<button id="login-btn" type="submit" class="btn btn-primary mt-3">Log In</button>
				</form>

			</div>

		</div>

		<div class="row " id="register-form">
			<div class="col-6 mx-auto mt-5 ">
				<form>
					<div class="form-group text-white  ">
						<label for="RegisterLogin">Choose your Login</label>
						<input type="text" class="form-control" id="RegisterLogin" aria-describedby="login"
							placeholder="Choose a login" required>

					</div>
					<div class="form-group text-white mt-2 ">
						<label for="RegisterPassword">Choose your Password</label>
						<input type="password" class="form-control" id="RegisterPassword" placeholder="Password" required>
					</div>
					<div class="form-group text-white mt-2 ">
						<label for="RegisterPasswordConfirm">Confirm your Password</label>
						<input type="password" class="form-control" id="RegisterPasswordConfirm" placeholder="Password" required>
					</div>
					<button id="register-btn" type="submit" class="btn btn-primary mt-3">Create your account</button>
				</form>

			</div>
`;
    }
  }
}

export default LandingView;
