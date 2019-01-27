const expect = require("chai").expect;
const FetchScript = require("../src");
const lib = require('./lib');


describe("setVaribles", () => {

  const code = lib.getScriptCode('setVariables');
  const fetchScript = new FetchScript();
  fetchScript.setVariables({
    foo: 'fou du fafa'
  })
  let output = null;
  before(done => {
    fetchScript.executeCode(code).then((out) => {
      output = out
      done();
    });
  });

  it('should inject vars', () => {
    expect(output[0]).to.equal('fou du fafa')
  })

  it('should leave local vars untouched', () => {
    expect(output[1]).to.equal('moe')
  })

});
