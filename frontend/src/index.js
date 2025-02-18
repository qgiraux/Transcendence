/**
 * The entrypoint of our great app
 */

import RootView from "./views/RootView.js";
import LandingView from "./views/LandingView.js";
import HomeView from "./views/HomeView.js";
import ProfileView from "./views/ProfileView.js";
import Router from "./Router.js";
import FriendsView from "./views/FriendsView.js";
import BlocksView from "./views/BlocksView.js";
import TwofaView from "./views/TowfaView.js";
import TournamentView from "./views/TournamentView.js";
import AccountManagementView from "./views/AccountManagementView.js";
import LogoutView from "./views/LogoutView.js";
import PongGameView from "./views/PongGameView.js";
import CreateTournamentView from "./views/CreateTournamentView.js";
import Application from "./Application.js";
import AccountDeleteView from "./views/AccountDeleteView.js";
import TwofaLoginView from "./views/TwofaLoginView.js";

// async function initializeLanguageSelector() {
//   await Application.setLanguage(Application.lang);
//   await Application.applyTranslations();
// }

const router = new Router();
router.addRoute("/", RootView);
router.addRoute("/landing", LandingView);
router.addRoute("/twofalogin/:token", TwofaLoginView);
router.addRoute("/home", HomeView);
router.addRoute("/profile", ProfileView);
router.addRoute("/profile/:id", ProfileView);
router.addRoute("/friends", FriendsView);
router.addRoute("/account", AccountManagementView);
router.addRoute("/logout", LogoutView);
router.addRoute("/pong", PongGameView);
router.addRoute("/blocks", BlocksView);
router.addRoute("/twofa", TwofaView);
router.addRoute("/tournaments", TournamentView);
router.addRoute("/create-tournament", CreateTournamentView);
router.addRoute("/delete", AccountDeleteView);

router.setListeners();
router.route();

Application.router = router;

// initializeLanguageSelector();

const langSelector = document.getElementById("lang-select");

langSelector.addEventListener("change", Application.listenForLanguageChange);
