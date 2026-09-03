const webhook = require("../example/webhook");
const jest = require("jest");

describe("webhook", () => {
  describe("serve", () => {
    it("should return a response when called with valid arguments", async () => {
      const kp = {};
      const name = "test.name";
      const func = async (args) => {
        return `henlo, ${JSON.stringify(args)}`;
      };

      const response = await webhook.serve(kp, name, func);

      expect(response).toBeDefined();
      expect(response).toEqual(`henlo, ${JSON.stringify({})}`);
    });

    it("should throw an error when called with invalid arguments", async () => {
      const kp = null;
      const name = null;
      const func = null;

      await expect(webhook.serve(kp, name, func)).rejects.toThrow();
    });
  });

  describe("webhookclient", () => {
    it("should initialize correctly with valid inputs", async () => {
      const PORT = 3000;

      webhook.webhookclient(PORT);

      expect(webhook.run).toBeDefined();
    });

    it("should throw an error with invalid inputs", async () => {
      const PORT = null;

      expect(() => webhook.webhookclient(PORT)).toThrow();
    });
  });
});
