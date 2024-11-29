import AbstractView from "./AbstractView.js";

class ErrorView extends AbstractView {
  constructor(params) {
    super(params);
    this._setTitle("DefaultView");
    this.onStart();
  }

  onStart() {
    this._setHtml();
  }

  _setHtml() {
    let pm = "";
    const container = document.querySelector(".container");
    for (const key in this.params) {
      pm += String(key) + " : " + this.params[key] + "<br>";
    }
    if (container) {
      container.innerHTML = `<h1>Oh Oh : 404 Not found !</h1>
					<p>The url is ${location.pathname} </p>
					params<br> ${pm} </p>
					`;
    }
  }
}

export default ErrorView;
