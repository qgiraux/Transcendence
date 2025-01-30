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
    const container = document.querySelector("#view-container");
    for (const key in this.params) {
      pm += String(key) + " : " + this.params[key] + "<br>";
    }
    if (container) {
      container.innerHTML = `

		<div class="container d-flex flex-column align-items-center justify-content-center vh-100 text-center">
				<h1 class="display-1 fw-bold text-danger">404</h1>
				<img src="/img/404.jpg" alt="Error 404" class="img-fluid" style="max-width: 300px;">
				<p class="mt-3 fs-5 text-white">Sorry the page you're looking for doesn't't exist.</p>
				<p class="mt-3 fs-5 text-white">Path:  ${location.pathname}</p>
				<p class="mt-3 fs-5 text-white">Dynamic parameters:  ${pm}</p>
				<a href="/home" data-link class="btn btn-primary mt-3">Back to Home</a>
			</div>



					`;
    }
  }
}

export default ErrorView;
