import Application from "../Application.js";
import AbstractView from "./AbstractView";
import Alert from "../Alert.js";
import Router from "../Router.js";

class PongView extends AbstractView {
    constructor(params) {
        super(params);
        this._setTitle("PongView");
        this.onStart();
    }

    onStart() {
        if (Application.getAccessToken() == null) {
            setTimeout(() => {
                Router.reroute("/landing");
            }, 50);
            return;
        }
        this.setHtml();
        // TBC
    }

    setHtml() {
        const container = document.querySelector("#view-container");
        if (container) {
            container.innerHTML = ``
        }
    }
}