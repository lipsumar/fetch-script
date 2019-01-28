const moxios = require('moxios')
const fs = require('fs')
const path = require('path')

const users = require('./data/users.json')
const users2 = require('./data/users-page2.json')

module.exports = {
  mockSampleApi (axios) {
    moxios.install(axios)
    moxios.stubRequest('http://jsonplaceholder.typicode.com/users', {
      status: 200,
      responseText: JSON.stringify(users)
    })
    moxios.stubRequest('http://jsonplaceholder.typicode.com/users/?page=2', {
      status: 200,
      responseText: JSON.stringify(users2)
    })
    users.forEach((user, i) => {
      moxios.stubRequest('http://jsonplaceholder.typicode.com/users/' + (i + 1), {
        status: 200,
        responseText: JSON.stringify(user)
      })
    })

    return () => {
      moxios.uninstall(axios)
    }
  },

  moxios,

  getScriptCode (name) {
    return fs.readFileSync(path.join(__dirname, 'scripts/' + name), { encoding: 'utf8' })
  }
}
