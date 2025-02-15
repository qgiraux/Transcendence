import DefaultView from "./views/ErrorView.js";
import AbstractView from "./views/AbstractView.js";
class Router {
  /**
   * The Router class
   * takes an Application instance as a parameter
   * addRoute(schema) : create a route with a matching Regex
   * route() : is called when a data-link is clicked or during a popstate() event
   *this fucntion will match all the route and instantiate the correpsonding view
   */
  static _instance;
  #routes = [];
  #currentView = null;

  constructor() {
    if (Router._instance) {
      throw new Error(
        "Router Singleton classes can't be instantiated more than once."
      );
    }
    Router._instance = this;
    this.addRoute.bind(this);
    this._matchRoute.bind(this);
  }

  getCurrentView() {
    return this.#currentView;
  }

  setListeners() {
    window.addEventListener("popstate", this.route.bind(this));
    document.addEventListener("click", this._handleLinkClick.bind(this));
    document.addEventListener("redirect", this._redirect.bind(this));
  }

  _handleLinkClick(event) {
    const link = event.target.closest("a[data-link]");

    if (link) {
      event.preventDefault();
      const href = link.getAttribute("href");
      history.pushState(null, null, href);
      this.route();
    }
  }

  /* Add a route to the router '/location/.../:dynamicparam1/:dynamicparam2' */
  addRoute(schema, view) {
    /**
     *Adds a route to the router
     * @param {String} schema -the route schema
     * @param {AbstractView} view -the view to instantiate
     */
    if (typeof schema !== "string" || schema[0] !== "/")
      throw new Error("Router: addRoute: Invalid route schema");
    if (schema === "/") {
      this.#routes.push({
        params: [],
        schema: "/",
        split_length: 1,
        view: view,
        regex: new RegExp("^/$"),
      });
    }

    const newroute = {};
    newroute.params = []; // stocke les parametres dynamiques
    newroute.schema = schema; // schema de l'uri
    newroute.view = view; // reference vers la classe view a appeler si la route matche

    const split = schema.split(/\//).filter((str) => str.length > 0);
    newroute.split_length = split.length;
    //checker qu'il n'y a pas de parametres dynamiques avant les params statiques et fabriquer la regex
    let switchedToDyn = false;
    let strregex = "";
    for (const param of split) {
      if (param[0] === ":") {
        switchedToDyn = true;
        newroute.params.push(String(param.slice(1)));
        strregex += "/([^/]+)";
        continue;
      }
      if (param[0] !== ":") {
        if (switchedToDyn)
          throw new Error("Router: addRoute: Invalid route schema");
        strregex += `/${param}`;
      }
    }
    strregex += "$";
    newroute.regex = new RegExp(strregex); // regex permettant de matcher l'uri et le schema
    this.#routes.push(newroute);
  }
  //match the url with the route and return the matched one or null
  _matchRoute(url) {
    for (const route of this.#routes) {
      const url_split = url.split(/\//).filter((str) => str.length > 0);
      if (route.regex.test(url) && route.split_length === url_split.length) {
        let values = route.regex.exec(url);
        values = values.slice(1);
        return new route.view(
          Object.fromEntries(
            route.params.map((key, index) => [key, values[index]])
          )
        );
      }
    }
    return null;
  }

  route() {
    if (this.#currentView !== null) this.#currentView.onDestroy();
    this.#currentView = null;
    let newView = this._matchRoute(location.pathname);
    if (newView === null) {
      newView = new DefaultView({});
    }
    this.#currentView = newView;
  }

  _redirect(event) {
    history.pushState(null, null, event.detail.route);
    this.route();
  }

  //AV = I added the hyphen because this rule blocked the rerouting to /create-tournaments in case of a language change
  static reroute(uri) {
    const regex = /^\/[a-zA-Z0-9\/-\=\:]*$/;
    if (!regex.test(uri)) throw new Error("Router::reroute : invalid route");
    const event = new CustomEvent("redirect", {
      detail: {
        route: uri,
      },
    });
    document.dispatchEvent(event);
  }
}

export default Router;
