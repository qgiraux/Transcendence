import TRequest from "./TRequest.js";

class Alert {
  static errorMessage(title, message) {
	const alertContainer = document.querySelector("#alert-container");
    alertContainer.innerHTML += `
	<div class="row">
	<div class="col-6 mx-auto">
	<div class="alert alert-danger alert-dismissible fade show" role="alert">
	<strong>${title}</strong><p> ${message}</p>
	<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
	</div></div></div>
	`;

	document.addEventListener("click", (event) => {
		const alertElement = alertContainer.querySelector(".alert");
		if (alertElement && !alertElement.contains(event.target)) {
		  alertElement.remove();
		}
	  });
  }

  static successMessage(title, message) {
    const alertContainer = document.querySelector("#alert-container");
	alertContainer.innerHTML += `
	<div class="row">
	<div class="col-6 mx-auto">
	<div class="alert alert-success alert-dismissible fade show" role="alert">
	<strong>${title}</strong><p> ${message}</p>
	<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
	</div></div></div>
	`;

	document.addEventListener("click", (event) => {
		const alertElement = alertContainer.querySelector(".alert");
		if (alertElement && !alertElement.contains(event.target)) {
		  alertElement.remove();
		}
	  });
  }

  static classicMessage(title, message) {
    const alertContainer = document.querySelector("#alert-container")
	alertContainer.innerHTML += `
	<div class="row">
	<div class="col-6 mx-auto">
	<div class="alert alert-primary alert-dismissible fade show" role="alert">
	<strong>${title}</strong><p> ${message}</p>
	<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
	</div></div></div>
	`;

	document.addEventListener("click", (event) => {
		const alertElement = alertContainer.querySelector(".alert");
		if (alertElement && !alertElement.contains(event.target)) {
		  alertElement.remove();
		}
	  });
  }

  static inviteMessage(title, message, link) {
    const alertContainer = document.querySelector("#alert-container");

    // Generate the alert HTML
    const alertHTML = `
	  <div class="row">
		<div class="col-6 mx-auto">
		  <div class="alert alert-primary alert-dismissible fade show" role="alert">
			<strong>${title}</strong><p>${message}</p>
			<a href="#" class="accept-invite">Accept</a>

			<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
		  </div>
		</div>
	  </div>`;
 
	// Append the alert to the container
	alertContainer.innerHTML += alertHTML;
  
	// Query the new element after appending to the DOM
	setTimeout(() => {
	  const inviteLink = alertContainer.querySelector(".accept-invite");
	  if (inviteLink) {
		inviteLink.addEventListener("click", async (event) => {
		  event.preventDefault();
		  const form = { "name": link }; // Correct JSON structure
		  try {
			const ret = await TRequest.request("POST", "/api/tournament/join/", form);
			console.log(ret);
			this.clearAlerts();
			Alert.successMessage("Success", `Invite accepted successfully for tournament: ${link}`);
		  } catch (error) {
			Alert.errorMessage("Error", "Failed to accept the invite.");
		  }
		});
	  } else {
		console.error("Invite link not found in the DOM.");
	  }
	}, 0); // Allow the DOM to update

	// Auto delete the alert after 5 seconds
	setTimeout(() => {
	  const alertElement = alertContainer.querySelector(".alert");
	  if (alertElement) {
		alertElement.remove();
	  }
	}, 15000);
	// Close the alert when clicking outside the window
	document.addEventListener("click", (event) => {
	  const alertElement = alertContainer.querySelector(".alert");
	  if (alertElement && !alertElement.contains(event.target)) {
		alertElement.remove();
	  }
	});
  }

  static clearAlerts() {
    document.querySelector("#alert-container").innerHTML = "";
  }
}

export default Alert;
