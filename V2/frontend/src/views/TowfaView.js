import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";

class TwofaView extends AbstractView {
    constructor(params) {
        super(params);
        this._setTitle("DefaultView");
        this.domText = {};
        this.domText.scanQR = "Scan this QRcode with your authentificator app";
        this.messages = {};
        this.messages.wentWrong = "Something went wrong";
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
                Alert.errorMessage(this.messages.wentWrong, error.message);
            });
    }

    _setHtml() {
        const container = document.querySelector("#view-container");

        if (container) {
            // Create a blob URL from the binary PNG data
            const imageUrl = URL.createObjectURL(this.imageBlob);

            container.innerHTML = `
                <h1 class="text-white display-4">${this.domText.scanQR}</h1>
                <div class="row p-2 mb-0">
                    <div class="col-3 mx-1">
						
                        <img src="${imageUrl}" alt="QR Code" class="img-fluid">
                    </div>
                </div>    
            `;
        }
    }
}

export default TwofaView;
