/* eslint-disable no-undef */
const expect = require('chai').expect
const FetchScript = require('../src')
const lib = require('./lib')

const users = require('./data/users.json')

describe('Resource', () => {
  describe('Basics', () => {
    const code = lib.getScriptCode('resource/basics')
    const fetchScript = new FetchScript()

    let vars = null
    let undoMock = null
    before(done => {
      undoMock = lib.mockSampleApi(fetchScript.interpreter.moduleResource.axios)
      lib.moxios.stubRequest('http://some-api.org/route', {
        status: 200,
        responseText: '{"some-api":"hello"}'
      })
      fetchScript.executeCode(code).then((out) => {
        vars = fetchScript.getVars()
        done()
      })
    })
    after(() => {
      undoMock()
    })

    it('should fetch single resources', () => {
      expect(vars.one).to.deep.equal(users.find(u => u.id === 1))
      expect(vars.multi).to.deep.equal(users)
      expect(vars.withoutSetupApi).to.deep.equal({ 'some-api': 'hello' })
      expect(vars.dynOne).to.deep.equal(users.find(u => u.id === 3))
    })

    it('should fetch multiple (expanded) resources', () => {
      expect(vars.dynMulti).to.have.lengthOf(3)
      expect(vars.dynMulti[1]).to.deep.equal(users.find(u => u.id === 5))
    })
  })

  describe('Pagination', () => {
    const code = lib.getScriptCode('resource/pagination')
    const fetchScript = new FetchScript()

    let vars = null
    let undoMock = null
    before(done => {
      undoMock = lib.mockSampleApi(fetchScript.interpreter.moduleResource.axios)
      fetchScript.executeCode(code).then((out) => {
        vars = fetchScript.getVars()
        done()
      })
    })
    after(() => {
      undoMock()
    })

    it('should fetch single resource', () => {
      expect(vars.one).to.deep.equal(users.find(u => u.id === 1))
      expect(vars.onepage).to.have.lengthOf(10)
    })

    it('should paginate resource', () => {
      expect(vars.all).to.have.lengthOf(12)
    })
  })
})
