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
      undoMock = lib.mockSampleApi(fetchScript.interpreter.moduleResource.axios)
      fetchScript.executeCode(code).then(() => {
        vars = fetchScript.getVars();
        done();
      });
    });
    after(() => {
      undoMock()
    });
    it("should assign js", () => {
      expect(vars.a, 'a is set').to.equal("foo is bar");
      expect(vars.b, 'b is set').to.equal("foo is bar");
      expect(vars.c).to.equal("foo is bar and it smells nice");
    });
    it("should assign resources", () => {
      expect(vars.u).to.deep.equal(users[0]);
      expect(vars.us).to.deep.equal(users);
      expect(vars.all).to.deep.equal(users);
    });
    it('should assign multiline objects', () => {
      expect(vars.obj).to.deep.equal({foo: 'bar', bar: 'baz'})
    })

    it('should assign in objects', () => {
      expect(vars.obj2).to.deep.equal({hello: 'there'})
    })
    it('should sub-assign', () => {
      users.forEach((user,i) => {
        expect(vars.users[i].foo).to.deep.equal(user)
      })
    })
    it('should assign in loops', () => {
      users.forEach((user,i) => {
        expect(vars.usersLoop[i].again).to.deep.equal(user)
      })
    })
    it('should assign in arrays', () => {
      expect(vars.stuff).to.deep.equal([1, 'foo', 3])

    })

  });
});
