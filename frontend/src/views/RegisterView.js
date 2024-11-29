import Router from "../Router.js";
import AbstractView from "./AbstractView.js";

class RegisterView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("Register");
    this.onStart();
  }

  _validatePass(passwordValue) {
    // Logique a ameliorer avec un regex
    return passwordValue.length >= 3;
  }

  _validateLogin(loginValue) {
    // Logique a ameliorer avec un regex
    return loginValue.length >= 3;
  }
  _displayError(msg) {
    const alert = document.querySelector("#alert");
    alert.innerHTML = msg;
    alert.style.display = "block";
  }
  _hideError() {
    const alert = document.querySelector("#alert");
    alert.style.display = "none";
  }
  _submitHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    this._hideError();
    const login = document.querySelector("#InputLogin");
    const password = document.querySelector("#InputPassword");
    if (
      this._validateLogin(login.value) &&
      this._validatePass(password.value)
    ) {
      this.RegisterRequest({ username: login.value, password: password.value });
    } else {
      this._displayError("You must provide a valid login and password");
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
      Router.reroute("/login");
    } catch (error) {
      console.error(error.message);
    }
  }

  onStart() {
    this.setHtml();
    //Alert placeholder
    const alert = document.querySelector("#alert");
    alert.style.display = "none";

    // Submit button
    this.addEventListener(
      document.querySelector("#submit-btn"),
      "click",
      this._submitHandler.bind(this)
    );
  }

  setHtml() {
    let pm = "";
    const container = document.querySelector(".container");
    for (const key in this.params) {
      pm += String(key) + " : " + this.params[key] + "<br>";
    }
    if (container) {
      container.innerHTML = `<h1>Welcome to Transcendence</h1><br>
	  <h2>Please login to register to create an account</h2><br>
    <div class="alert alert-danger" role="alert" id='alert'></div>
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
	<p>Already have an account ? <a href="/login" data-link>login</a></p>
`;
    }
  }
}

export default RegisterView;
