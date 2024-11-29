import Router from "./Router";
import DummyView from "./views/DummyView.js";

const r = new Router();
test("Test Router : matching route", () => {
  r.addRoute("/hello", DummyView);
  expect(r._matchRoute("/hello")).not.toBe(null);
});

test("Test Router : matching type", () => {
  r.addRoute("/hello", DummyView);
  expect(r._matchRoute("/hello")).toBeInstanceOf(DummyView);
});

test("Test Router: not matching route", () => {
  r.addRoute("/hello", DummyView);
  expect(r._matchRoute("/toto")).toBe(null);
});

// try to create a new instance of Router() whc should throw an error
test("Test Router: Singleton", () => {
  expect(() => {
    const s = new Router();
  }).toThrow();
});

test("Test Router: dynamic parameters", () => {
  r.addRoute("/hello/:param1/:param2", DummyView);
  expect(r._matchRoute("/hello/1/2").params).toHaveProperty("param1", "1");
  expect(r._matchRoute("/hello/1/2").params).toHaveProperty("param2", "2");
});
