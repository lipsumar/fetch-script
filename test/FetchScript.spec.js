const expect = require("chai").expect;
const sinon = require("sinon");
const moxios = require("moxios");
const FetchScript = require("../src");

describe("FetchScript", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("should output back a non-url string", done => {
    const fetchScript = new FetchScript();
    const errorSpy = sinon.spy();
    fetchScript.once("out", out => {
      expect(out.data).to.equal("hi there");
      expect(out.resource).to.equal("hi there");
      expect(errorSpy.notCalled).to.be.true;
      done();
    });
    fetchScript.on("error", errorSpy);
    fetchScript.execute("hi there");
  });

  describe("Fetch and output any input", () => {
    it("should emit error on wrong urls", done => {
      moxios.stubRequest("http://unicorns-are-real.cloud/api/get-stuff", {
        status: 404
      });
      const fetchScript = new FetchScript({
        apis: {
          apifoo: {
            baseUrl: "http://unicorns-are-real.cloud/api"
          }
        }
      });
      const outSpy = sinon.spy();
      fetchScript.once("out", outSpy);
      fetchScript.once("error", out => {
        expect(out.resource).to.equal("/apifoo/get-stuff");
        expect(outSpy.notCalled).to.be.true;
        done();
      });
      fetchScript.execute("/apifoo/get-stuff");
    });

    it("should fetch and output valid urls", done => {
      const resp = [{ id: 1, type: "stuff" }, { id: 2, type: "stuff" }];
      moxios.stubRequest("http://unicorns-are-real.cloud/api/get-stuff", {
        status: 200,
        responseText: JSON.stringify(resp)
      });
      const fetchScript = new FetchScript({
        apis: {
          apifoo: {
            baseUrl: "http://unicorns-are-real.cloud/api"
          }
        }
      });
      const errorSpy = sinon.spy();
      fetchScript.once("out", out => {
        expect(out.resource).to.equal("/apifoo/get-stuff");
        expect(out.data).to.deep.equal(resp);
        expect(errorSpy.notCalled).to.be.true;
        done();
      });
      fetchScript.once("error", errorSpy);
      fetchScript.execute("/apifoo/get-stuff");
    });
  });

  describe("Variables", () => {
    it("should set strings in vars", done => {
      const fetchScript = new FetchScript();
      const errorSpy = sinon.spy();
      const outSpy = sinon.spy();
      fetchScript.once("out", outSpy);
      fetchScript.on("error", errorSpy);
      fetchScript.execute("foo = magic pants").then(() => {
        expect(fetchScript.getVars().foo).to.equal("magic pants");
        expect(errorSpy.notCalled).to.be.true;
        expect(outSpy.notCalled).to.be.true;
        done();
      });
    });

    it("should fetch and set api responses in vars", done => {
      const resp = [{ id: 1, type: "chichi" }, { id: 2, type: "chichi" }];
      moxios.stubRequest("http://unicorns-are-real.cloud/api/get-chichi", {
        status: 200,
        responseText: JSON.stringify(resp)
      });
      const fetchScript = new FetchScript({
        apis: {
          apifoo: {
            baseUrl: "http://unicorns-are-real.cloud/api"
          }
        }
      });
      const errorSpy = sinon.spy();
      const outSpy = sinon.spy();
      fetchScript.once("out", outSpy);
      fetchScript.once("error", errorSpy);
      fetchScript.execute("chi = /apifoo/get-chichi").then(() => {
        expect(fetchScript.getVars().chi).to.deep.equal(resp);
        expect(errorSpy.notCalled).to.be.true;
        expect(outSpy.notCalled).to.be.true;
        done();
      });
    });

    it("should replace variables in output", () => {
      const fetchScript = new FetchScript();
      fetchScript.vars.foo = "foo_var_content";
      const errorSpy = sinon.spy();
      fetchScript.once("out", out => {
        expect(out.data).to.equal("hi foo_var_content");
        expect(out.resource).to.equal("hi foo_var_content");
        expect(errorSpy.notCalled).to.be.true;
        done();
      });
      fetchScript.on("error", errorSpy);
      fetchScript.execute("hi {foo}");
    });

    it("should replace multiplie variables in output", () => {
      const fetchScript = new FetchScript();
      fetchScript.vars.foo = "foo_var_content";
      fetchScript.vars.bar = "bar_var_content";
      const errorSpy = sinon.spy();
      fetchScript.once("out", out => {
        expect(out.data).to.equal("hi foo_var_content and bar_var_content !");
        expect(out.resource).to.equal(
          "hi foo_var_content and bar_var_content !"
        );
        expect(errorSpy.notCalled).to.be.true;
        done();
      });
      fetchScript.on("error", errorSpy);
      fetchScript.execute("hi {foo} and {bar} i");
    });
  });

  describe("Expand commands", () => {
    it("should expand output commands", done => {
      const resp = [{ id: 1, type: "bar" }, { id: 2, type: "bar" }];
      moxios.stubRequest("http://unicorns-are-real.cloud/api/get-bar", {
        status: 200,
        responseText: JSON.stringify(resp)
      });
      moxios.stubRequest("http://unicorns-are-real.cloud/api/bar/1", {
        status: 200,
        responseText: JSON.stringify(resp[0])
      });
      moxios.stubRequest("http://unicorns-are-real.cloud/api/bar/2", {
        status: 200,
        responseText: JSON.stringify(resp[1])
      });
      const fetchScript = new FetchScript({
        apis: {
          apifoo: {
            baseUrl: "http://unicorns-are-real.cloud/api"
          }
        }
      });
      const errorSpy = sinon.spy();
      const outSpy = sinon.spy();
      expect(fetchScript.getVars()).to.deep.equal({});
      fetchScript.on("out", outSpy);
      fetchScript.once("error", errorSpy);
      fetchScript
        .execute(["chi = /apifoo/get-bar", "/apifoo/bar/{chi[*].id}"])
        .then(() => {
          expect(fetchScript.getVars().chi).to.deep.equal(resp);
          expect(errorSpy.notCalled).to.be.true;
          expect(outSpy.calledTwice).to.be.true;
          expect(
            outSpy.firstCall.calledWithExactly({
              resource: "/apifoo/bar/1",
              data: resp[0]
            })
          );
          expect(
            outSpy.secondCall.calledWithExactly({
              resource: "/apifoo/bar/2",
              data: resp[1]
            })
          );
          done();
        });
    });
  });
});
