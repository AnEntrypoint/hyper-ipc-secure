const server = require("../example/server");
const jest = require("jest");

describe("server", () => {
  describe("serve", () => {
    it("should return a response when called with valid arguments", async () => {
      const kp = {};
      const name = "test.name";
      const func = async (args) => {
        return `henlo, ${JSON.stringify(args)}`;
      };

      const response = await server.serve(kp, name, func);

      expect(response).toBeDefined();
      expect(response.message).toEqual(`henlo, ${JSON.stringify({})}`);
    });

    it("should throw an error when called with invalid arguments", async () => {
      const kp = null;
      const name = null;
      const func = null;

      await expect(server.serve(kp, name, func)).rejects.toThrow();
    });
  });
});
