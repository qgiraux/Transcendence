/**
 * The entrypoint of our great app
 */
import RootView from "./views/RootView.js";
import LandingView from "./views/LandingView.js";
import HomeView from "./views/HomeView.js";
import Router from "./Router.js";
import FriendsView from "./views/FriendsView.js";

const router = new Router();
router.addRoute("/", RootView);
router.addRoute("/landing", LandingView);
router.addRoute("/home", HomeView);
router.addRoute("/friends", FriendsView);
router.setListeners();
router.route();
