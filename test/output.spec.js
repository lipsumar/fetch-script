const expect = require("chai").expect;
const FetchScript = require("../src");
const lib = require('./lib');

const users = require('./data/users.json')

describe("Output", () => {

  describe("Running scripts/output", () => {
    const code = lib.getScriptCode('output');
    const fetchScript = new FetchScript();

    let output = null;
    let undoMock = null;
    before(done => {
      undoMock = lib.mockSampleApi(fetchScript.axios);
      fetchScript.executeCode(code).then((out) => {
        output = out
        done();
      });
    });
    after(() => {
      undoMock()
    });

    it("should output a js string", () => {
      expect(output[0]).to.equal('hi there')
    });

    it('should output a var', () => {
      expect(output[1]).to.equal('hello')
    })

    it('should output a js expression', () => {
      expect(output[2]).to.equal('hello dude')
    })

    it('should output a resource', () => {
      expect(output[3]).to.deep.equal(users[0])
    })

    it('should output expanded string', () => {
      let expected = users.map(u => `${u.id},${u.name}`).join('\n')
      expect(output[4]).to.equal(expected)

      expected = users.map(u => `oho:${u.id},${u.name}`).join('\n')
      expect(output[5]).to.equal(expected)
    })

    it('should output expanded resource', () => {
      expect(output[6]).to.deep.equal(users)
    })

    it('should output multiline objects', () => {
      expect(output[7]).to.deep.equal({foo: 'bar', baz: 'Leanne Graham'})
    })

    it('should output in loops', () => {
      users.forEach((u,i) => {
        expect(output[8+i]).to.equal(u.name)
      })
    })
  });
});
