const webhookclient = require("../webhookclient");

describe("webhookclient", () => {
  describe("init", () => {
    it("should initialize correctly with valid inputs", async () => {
      const PORT = 3000;
      const IPCNODE = {};

      webhookclient.init(PORT, IPCNODE);

      expect(IPCNODE.run).toBeDefined();
    });

    it("should throw an error with invalid inputs", async () => {
      const PORT = null;
      const IPCNODE = null;

      expect(() => webhookclient.init(PORT, IPCNODE)).toThrow();
    });
  });
});
