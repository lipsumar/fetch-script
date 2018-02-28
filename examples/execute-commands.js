const FetchScript = require("../src");
const fetchScript = new FetchScript({
  apis: {
    jph: {
      baseUrl: "http://jsonplaceholder.typicode.com"
    }
  }
});

fetchScript.on("out", data => {
  console.log("Data out:", data);
});

fetchScript.on('error', error => {
  console.error("Error:", error)
})

fetchScript.execute(["foos = /jph/users", "/jph/users/{foos[*].id}"]);
