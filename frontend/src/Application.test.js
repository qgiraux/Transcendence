import Application from "./Application";

// try to create a new instance of Application() which should throw an error
test("Test App: instantiation", () => {
  expect(() => {
    const s = new Application();
  }).toThrow();
});
