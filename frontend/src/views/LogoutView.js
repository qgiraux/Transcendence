
import AbstractView from "./AbstractView.js";
import Application from "../Application.js";
import Router from "../Router.js";

class LogoutView extends AbstractView {
    friendList = [];
    userList = [];
    constructor(params) {
      super(params);
      this.onStart();
    }
  
    onStart() {
        
            Application.deleteRefreshToken();
            Application.deleteAccessToken();
            Router.reroute('/landing');
            console.log("ON LOGOUT VIEW")

    }
}

export default LogoutView;