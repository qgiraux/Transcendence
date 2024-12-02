import AbstractView from "./AbstractView.js";
import Application from "../Application.js";
import Router from "../Router.js";

class LoginView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Login");
    this.onStart();
  }

  onStart() {
    this.setHtml();
    //Alert placeholder
    // this._hideAlert();

    // Submit button
    this.addEventListener(
      document.querySelector("#submit-btn"),
      "click",
      this._submitHandler.bind(this)
    );
  }

  _validatePass(passwordValue) {
    // Logique a ameliorer avec un regex
    return passwordValue.length >= 3;
  }

  _validateLogin(loginValue) {
    // Logique a ameliorer avec un regex
    return loginValue.length >= 3;
  }
  //   _displayAlert(msg) {
  //     const alert = document.querySelector("#alert-placeholder");
  //     alert.innerHTML = msg;
  //     alert.style.display = "block";
  //   }
  //   _hideAlert() {
  //     const alert = document.querySelector("#alert-placeholder");
  //     alert.style.display = "none";
  //   }
  _submitHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    // this._hideAlert();
    const login = document.querySelector("#InputLogin");
    const password = document.querySelector("#InputPassword");
    if (
      this._validateLogin(login.value) &&
      this._validatePass(password.value)
    ) {
      this.loginRequest({ username: login.value, password: password.value });
    } else {
      this._displayError("You must provide a valid login and password");
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
      Router.reroute("/home");
    } catch (error) {
      Alert.error(error.message); //ajouter affichge erreur dans le dom
    }
  }

  setHtml() {
    let pm = "";
    const container = document.querySelector(".container");
    for (const key in this.params) {
      pm += String(key) + " : " + this.params[key] + "<br>";
    }
    if (container) {
      container.innerHTML = `<h1>Welcome to Transcendence</h1><br>
	  <h2>Please login to access your account</h2><br>
	  <div id="alert-placeholder"></div>
    <form>
  <div class="form-group">
    <label for="InputLogin">Login</label>
    <input type="text" class="form-control" id="InputLogin" aria-describedby="emailHelp" placeholder="Enter login">
    <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
  </div>
  <div class="form-group">
    <label for="InputPassword">Password</label>
    <input type="password" class="form-control" id="InputPassword" placeholder="Password">
  </div>
  <button id="submit-btn" type="submit" class="btn btn-primary">Submit</button>
</form>
<p>Don't have an account yet ? <a href="/register" data-link>register</a></p>
`;
    }
  }
}

export default LoginView;
