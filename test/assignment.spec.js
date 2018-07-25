const expect = require("chai").expect;
const sinon = require("sinon");
const axios = require("axios");
const moxios = require("moxios");
const FetchScript = require("../src");
const fs = require("fs");
const path = require("path");

describe("Assignment", () => {
  beforeEach(() => {});

  afterEach(() => {});

  describe("Running scripts/assignments", () => {
    const code = fs.readFileSync(path.join(__dirname, "scripts/assignments"), { encoding: "utf8" });
    const fetchScript = new FetchScript();

    let vars = null;
    before(done => {
      moxios.install(fetchScript.axios);
      moxios.stubRequest("http://jsonplaceholder.typicode.com/users", {
        status: 200,
        responseText: JSON.stringify([{ id: 1 }, { id: 2, name: "dave" }])
      });
      moxios.stubRequest("http://jsonplaceholder.typicode.com/users/1", {
        status: 200,
        responseText: JSON.stringify({ id: 1, name: "norbert" })
      });
      moxios.stubRequest("http://jsonplaceholder.typicode.com/users/2", {
        status: 200,
        responseText: JSON.stringify({ id: 2, name: "dave" })
      });
      fetchScript.executeCode(code).then(() => {
        vars = fetchScript.getVars();
        done();
      });
    });
    after(() => {
      moxios.uninstall(fetchScript.axios);
    });
    it("should assign js", () => {
      expect(vars.a).to.equal("foo is bar");
      expect(vars.b).to.equal("foo is bar");
      expect(vars.c).to.equal("foo is bar and it smells nice");
    });
    it("should assign resources", () => {
      expect(vars.u.id).to.equal(1);
      expect(vars.u.name).to.equal("norbert");

      expect(vars.us.length).to.equal(2);
      expect(vars.us[0].id).to.equal(1);
      expect(vars.us[1].name).to.equal('dave');
      expect(vars.all.length).to.equal(2);
      expect(vars.all[1].name).to.equal('dave');

    });
  });
});
