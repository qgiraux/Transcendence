import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";

class TwofaView extends AbstractView {
    constructor(params) {
        super(params);
        this._setTitle("DefaultView");
        this.onStart();
    }

    onStart() {
        this._setTitle("Profile");
        if (Application.getAccessToken() === null) {
            setTimeout(() => {
                Router.reroute("/landing");
            }, 50);
            return;
        }

        // Make the request to the API to get the PNG image
        TRequest.request("GET", `/api/users/totp/create/`)
            .then((response) => {
                this.imageBlob = response;
                this._setHtml();
            })
            .catch((error) => {
                Alert.errorMessage("something went wrong", error.message);
            });
    }

    _setHtml() {
        const container = document.querySelector("#view-container");

        if (container) {
            // Create a blob URL from the binary PNG data
            const imageUrl = URL.createObjectURL(this.imageBlob);

            container.innerHTML = `
                <h1 class="text-white display-4">scan this qrcode with your authentificator app</h1>
                <div class="row p-2 mb-0">
                    <div class="col-3 mx-1">
						
                        <img src="${imageUrl}" alt="QR Code" class="img-fluid">
                    </div>
                </div>    
                <h1 class="text-white display-4">give your 2Fa code to confirm the activation</h1>
                <div class="row p-2 mb-0">
                    <div class="col-3 mx-1">
                        <input type="text" id="twofa" class="form-control" placeholder="2Fa code">
                    </div>
            `;
        container.querySelector("#twofa").addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                const twofaCode = container.querySelector("#twofa").value;
                TRequest.request("POST", `/api/users/enable_twofa/`, { "twofa": twofaCode })
                    .then((response) => {
                        Alert.successMessage("2FA code verified successfully");
                        Router.reroute("/profile");
                    })
                    .catch((error) => {
                        Alert.errorMessage("Invalid 2FA code", error.message);
                    });
                }
            });
        }
    }
}


export default TwofaView;
