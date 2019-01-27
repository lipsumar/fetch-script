const expect = require("chai").expect;
const FetchScript = require("../src");
const lib = require('./lib');

describe("Die", () => {

  describe("Die should stop execution", () => {
    const code = lib.getScriptCode('die/simple');
    const fetchScript = new FetchScript();

    let output = null;
    before(done => {
      fetchScript.executeCode(code).then((out) => {
        output = out
        done();
      });
    });

    it("should output the first line", () => {
      expect(output[0]).to.equal('should be said')
    });

    it('should not output third line', () => {
      expect(output).to.have.lengthOf(1)
    })

  });


  describe("Die in an if should stop execution", () => {
    const code = lib.getScriptCode('die/if');
    const fetchScript = new FetchScript();

    let output = null;
    let vars = null;
    before(done => {
      fetchScript.executeCode(code).then((out) => {
        output = out
        vars = fetchScript.getVars();
        done();
      });
    });

    it('should have isTrue set to true', () => {
      expect(vars.isTrue).to.be.true
    })

    it("should output the first line", () => {
      expect(output[0]).to.equal('should be said')
    });

    it("should output the second line", () => {
      expect(output[1]).to.equal('should also be said')
    });

    it('should not output third line', () => {
      expect(output).to.have.lengthOf(2)
    })

  });
});
