class Alert {
  static errorMessage(title, message) {
    document.querySelector("#alert-container").innerHTML += `
	<div class="row">
	<div class="col-6 mx-auto">
	<div class="alert alert-danger alert-dismissible fade show" role="alert">
	<strong>${title}</strong><p> ${message}</p>
	<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
	</div></div></div>
	`;
  }

  static successMessage(title, message) {
    document.querySelector("#alert-container").innerHTML += `
	<div class="row">
	<div class="col-6 mx-auto">
	<div class="alert alert-success alert-dismissible fade show" role="alert">
	<strong>${title}</strong><p> ${message}</p>
	<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
	</div></div></div>
	`;
  }

  static classicMessage(title, message) {
    document.querySelector("#alert-container").innerHTML += `
	<div class="row">
	<div class="col-6 mx-auto">
	<div class="alert alert-primary alert-dismissible fade show" role="alert">
	<strong>${title}</strong><p> ${message}</p>
	<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
	</div></div></div>
	`;
  }
  static clearAlerts() {
    document.querySelector("#alert-container").innerHTML = "";
  }
}

export default Alert;
