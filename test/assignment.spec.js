const expect = require("chai").expect;
const FetchScript = require("../src");
const lib = require('./lib')

const users = require('./data/users.json')

describe("Assignment", () => {
  beforeEach(() => {});

  afterEach(() => {});

  describe("Running scripts/assignments", () => {
    const code = lib.getScriptCode('assignments')
    const fetchScript = new FetchScript();

    let vars = null;
    let undoMock = null;
    before(done => {
      undoMock = lib.mockSampleApi(fetchScript.axios)
      fetchScript.executeCode(code).then(() => {
        vars = fetchScript.getVars();
        done();
      });
    });
    after(() => {
      undoMock()
    });
    it("should assign js", () => {
      expect(vars.a).to.equal("foo is bar");
      expect(vars.b).to.equal("foo is bar");
      expect(vars.c).to.equal("foo is bar and it smells nice");
    });
    it("should assign resources", () => {
      expect(vars.u).to.deep.equal(users[0]);
      expect(vars.us).to.deep.equal(users);
      expect(vars.all).to.deep.equal(users);
    });
  });
});
