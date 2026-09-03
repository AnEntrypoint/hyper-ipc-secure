const dockerServe = require("../dockerServe");
const Docker = require("dockerode");

describe("dockerServe", () => {
  describe("init", () => {
    it("should initialize correctly with valid inputs", async () => {
      const kp = {};
      const dockerImage = "testImage";
      const serve = jest.fn();

      dockerServe.init(kp, dockerImage, serve);

      expect(serve).toHaveBeenCalled();
    });

    it("should throw an error with invalid inputs", async () => {
      const kp = null;
      const dockerImage = null;
      const serve = jest.fn();

      expect(() => dockerServe.init(kp, dockerImage, serve)).toThrow();
    });
  });
});
