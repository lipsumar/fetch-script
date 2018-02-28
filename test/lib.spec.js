const expect = require("chai").expect;
const lib = require("../src/lib");

describe("lib", () => {
  describe("uniqueFilter", () => {
    it("should return unique array", () => {
      expect(
        [1, 1, 5, 7, "r", 5, "r"].filter(lib.uniqueFilter).length
      ).to.equal(4);
    });
  });
  describe("hasVariables", () => {
    it("should find existing variables", () => {
      expect(lib.hasVariables("this has {count} variables")).to.be.true;
    });
    it("should not find inexisting variables", () => {
      expect(lib.hasVariables("this has no variables")).to.be.false;
    });
  });
});
