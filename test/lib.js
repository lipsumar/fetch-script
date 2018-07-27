const moxios = require("moxios");
const fs = require("fs");
const path = require("path");

const users = require('./data/users.json')

module.exports = {
  mockSampleApi(axios) {
    moxios.install(axios);
    moxios.stubRequest("http://jsonplaceholder.typicode.com/users", {
      status: 200,
      responseText: JSON.stringify(users)
    });
    users.forEach((user, i) => {
      moxios.stubRequest("http://jsonplaceholder.typicode.com/users/" + (i + 1), {
        status: 200,
        responseText: JSON.stringify(user)
      });
    });

    return () => {
      moxios.uninstall(axios);
    }
  },

  getScriptCode(name) {
    return fs.readFileSync(path.join(__dirname, "scripts/"+name), { encoding: "utf8" })
  }
}