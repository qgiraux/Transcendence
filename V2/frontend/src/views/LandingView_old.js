import AbstractView from "./AbstractView.js";
import Application from "../Application.js";
import Alert from "../Alert.js";
import Router from "../Router.js";
import Avatar from "../Avatar.js";


class LandingView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Login");
    this.domText = {};
    this.domText.loginLabel = "Login";
    this.domText.enterLoginField = "Enter login";
    this.domText.passwordLabel = "Password";
    this.domText.passwordField = "Password required";
    this.domText.twofaLabel = "2FA code (if activated)";
    this.domText.twofaField = "2FA if required";
    this.domText.loginSubmit = "Log in";
    this.domText.chooseLogin = "Choose your login";
    this.domText.choosePassword = "Choose your password";
    this.domText.signInSubmit = "Create your account";
    this.messages = {};
    this.messages.loginAlertTitle = "Login Error";
    this.messages.registerAlertTitle = "Register Error";
    this.messages.invalidCredentials = "Invalid username or password";
    this.messages.wrongCredentialsFormat = `You must provide a valid username and password.
      The login must contains only letters or digits and be between 5-20 characters long <br>
	 The password must be contains at least 8 characters and contains one digit,
	 one uppercase letter and at least one special character : !@#$%^&* `;
    this.messages.serverError =
      "The server could not process your request. Please try again later";
    this.messages.userAlreadyExist =
      "A user with that username already exists.";
    this.messages.PasswordsDontMatch =
      "The two password fields must be identical";
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
    const validatExpr = new RegExp("^[a-zA-Z0-9]{5,20}$");
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
    const twofa = document.querySelector("#InputTwofa");
    if (
      this._validateLogin(login.value) &&
      this._validatePass(password.value)
    ) {
      this.loginRequest({
        username: login.value,
        password: password.value,
        twofa: twofa.value,
      });
    } else {
      Alert.errorMessage(this.messages.wrongCredentialsFormat);
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
      if (!response.ok) {
        if (response.status === 500) throw new Error(this.messages.serverError);
        throw new Error(this.messages.invalidCredentials);
      }
      const json = await response.json();
      Application.setToken(json);
      Application.setUserInfos();
      Application.toggleSideBar();
      Application.toggleChat();
      Application.openWebSocket("wss://localhost:5000/ws/chat/");
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
        <img src="/img/transcendence.webp" class="img-fluid" alt="Responsive image" style="max-height: 50vh; width: auto; display: block; margin: 0 auto;">
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
						<label for="InputLogin">${this.domText.loginLabel}</label>
						<input type="text" class="form-control" id="InputLogin" aria-describedby="emailHelp"
							placeholder=${this.domText.enterLoginField} required>

					</div>
					<div class="form-group text-white ">
						<label for="InputPassword">${this.domText.passwordLabel}</label>
						<input type="password" class="form-control" id="InputPassword" placeholder=${this.domText.passwordField}>
					</div>
          <div class="form-group text-white ">
						<label for="InputPassword">${this.domText.twofaLabel}</label>
						<input type="twofa" class="form-control" id="InputTwofa" placeholder="${this.domText.twofaField}">
					</div>
					<button id="login-btn" type="submit" class="btn btn-primary mt-3">${this.domText.loginSubmit}</button>
				</form>

			</div>

		</div>

		<div class="row " id="register-form">
			<div class="col-6 mx-auto mt-5 ">
				<form>
					<div class="form-group text-white  ">
						<label for="RegisterLogin">Choose your Login</label>
						<input type="text" class="form-control" id="RegisterLogin" aria-describedby="login"
							placeholder="${this.domText.chooseLogin}" required>

					</div>
					<div class="form-group text-white mt-2 ">
						<label for="RegisterPassword">${this.domText.choosePassword}</label>
						<input type="password" class="form-control" id="RegisterPassword" placeholder=${this.domText.passwordLabel} required>
					</div>
					<div class="form-group text-white mt-2 ">
						<label for="RegisterPasswordConfirm">Confirm your Password</label>
						<input type="password" class="form-control" id="RegisterPasswordConfirm" placeholder=${this.domText.passwordLabel} required>
					</div>
					<button id="register-btn" type="submit" class="btn btn-primary mt-3">${this.domText.signInSubmit}</button>
				</form>

			</div>
`;
    }
  }
}

//Old version


// setHtml() {
//   let pm = "";
//   const container = document.querySelector("#view-container");
//   if (container) {
//     container.innerHTML = `
//     <div class="row text-white ">
//     <div class="col-10 mx-auto justify-content-center mb-5">
//       <img src="/img/transcendence.webp" class="img-fluid" alt="Responsive image" style="max-height: 50vh; width: auto; display: block; margin: 0 auto;">
//     </div>

//   </div>
//   <div class="row text-white ">
//     <div class="col-6 mx-auto">
//       <div class="btn-group d-flex text-center" role="group" aria-label="toggle login register">
//         <input type="radio" class="btn-check" name="btnradio" id="loginradio" autocomplete="off" checked>
//         <label class="btn btn-outline-primary btn-custom" for="loginradio"> Login</label>

//         <input type="radio" class="btn-check" name="btnradio" id="registerradio" autocomplete="off">
//         <label class="btn btn-outline-primary btn-custom" for="registerradio">Create an account</label>
//       </div>
//     </div>

//   </div>

//   <div class="row " id="login-form">
//     <div class="col-6 mx-auto mt-5">
//       <form>
//         <div class="form-group text-white ">
//           <label for="InputLogin">Login</label>
//           <input type="text" class="form-control" id="InputLogin" aria-describedby="emailHelp"
//             placeholder="Enter login" required>

//         </div>
//         <div class="form-group text-white ">
//           <label for="InputPassword">Password</label>
//           <input type="password" class="form-control" id="InputPassword" placeholder="Password required">
//         </div>
//         <div class="form-group text-white ">
//           <label for="InputPassword">2FA code (if activated)</label>
//           <input type="twofa" class="form-control" id="InputTwofa" placeholder="2FA if required">
//         </div>
//         <button id="login-btn" type="submit" class="btn btn-primary mt-3">Log In</button>
//       </form>

//     </div>

//   </div>

//   <div class="row " id="register-form">
//     <div class="col-6 mx-auto mt-5 ">
//       <form>
//         <div class="form-group text-white  ">
//           <label for="RegisterLogin">Choose your Login</label>
//           <input type="text" class="form-control" id="RegisterLogin" aria-describedby="login"
//             placeholder="Choose a login" required>

//         </div>
//         <div class="form-group text-white mt-2 ">
//           <label for="RegisterPassword">Choose your Password</label>
//           <input type="password" class="form-control" id="RegisterPassword" placeholder="Password" required>
//         </div>
//         <div class="form-group text-white mt-2 ">
//           <label for="RegisterPasswordConfirm">Confirm your Password</label>
//           <input type="password" class="form-control" id="RegisterPasswordConfirm" placeholder="Password" required>
//         </div>
//         <button id="register-btn" type="submit" class="btn btn-primary mt-3">Create your account</button>
//       </form>

//     </div>
// `;
//   }
// }
// }


export default LandingView;
