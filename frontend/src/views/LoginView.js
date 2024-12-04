import AbstractView from "./AbstractView.js";
import Application from "../Application.js";
import Router from "../Router.js";

class LoginView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Login");
    this.onStart();
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

  onStart() {
    this.setHtml();
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
    // Logique a ameliorer avec un regex
    return passwordValue.length >= 3;
  }

  _validateLogin(loginValue) {
    // Logique a ameliorer avec un regex
    return loginValue.length >= 3;
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
      console.log("You must provide a valid login and password");
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
        console.log(json.detail);
        return;
      }
      Application.setToken(json);
      Application.setUserInfos(); //extract and store the id and username
      Application.toggleSideBar();
      Router.reroute("/home");
    } catch (error) {
      Alert.error(error.message); //ajouter affichge erreur dans le dom
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
      console.log("You must provide a valid user name and password "); // Ameliorer la gestion d'erreur
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
      console.error(error.message);
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
							placeholder="Enter login">

					</div>
					<div class="form-group text-white ">
						<label for="InputPassword">Password</label>
						<input type="password" class="form-control" id="InputPassword" placeholder="Password">
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
							placeholder="Choose a login">

					</div>
					<div class="form-group text-white mt-2 ">
						<label for="RegisterPassword">Choose your Password</label>
						<input type="password" class="form-control" id="RegisterPassword" placeholder="Password">
					</div>
					<div class="form-group text-white mt-2 ">
						<label for="RegisterPasswordConfirm">Confirm your Password</label>
						<input type="password" class="form-control" id="RegisterPasswordConfirm" placeholder="Password">
					</div>
					<button id="register-btn" type="submit" class="btn btn-primary mt-3">Create your account</button>
				</form>

			</div>
`;
    }
  }
}

export default LoginView;
