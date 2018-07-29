const expect = require("chai").expect;
const FetchScript = require("../src");
const lib = require('./lib');

const users = require('./data/users.json')

describe("Control structures", () => {

  describe("Running scripts/control-structures", () => {
    const code = lib.getScriptCode('control-structures');
    const fetchScript = new FetchScript();

    let output = null;
    let vars = null;
    before(done => {
      fetchScript.executeCode(code).then((out) => {
        output = out
        vars = fetchScript.getVars()
        done();
      });
    });

    it("should execute conditions correctly", () => {
      expect(output[0]).to.equal('true is true')
      expect(vars.fooIsTrue).to.equal(true)

      expect(output[1]).to.equal('true is not false')
      expect(vars.bangFoo).to.equal(true)

      expect(vars.obj).to.deep.equal({foo:'bar'})
    });

    it('should run loops correctly', () => {
      expect(vars.count).to.equal(7)
      expect(output[2]).to.equal('item 1')
      expect(output[3]).to.equal('item 2')
      expect(output[4]).to.equal('item 4')
    })

  });
});
