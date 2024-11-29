/**
 * The entrypoint of our great app
 */
import LoginView from "./views/LoginView.js";
import RegisterView from "./views/RegisterView.js";
import RootView from "./views/RootView.js";
import HomeView from "./views/HomeView.js";
import Router from "./Router.js";

const router = new Router();
router.addRoute("/", RootView);
router.addRoute("/login", LoginView);
router.addRoute("/register", RegisterView);
router.addRoute("/home", HomeView);
router.setListeners();
router.route();
