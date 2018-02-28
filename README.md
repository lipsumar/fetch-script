# fetch-script

**DISCLAIMER: This is a work in progress**

> fetch-script allows to fetch APIs and output in a very succinct manner

## Usage

### As a cli tool

First install the cli tool
```bash
npm i -g fetch-script-cli
```

Then you can use it in the following ways:

```bash
# execute a script
fetch-script path/to/script.fetch-script

# start an interactive session
fetch-script
```

## As a node module

First install the module

```bash
npm install fetch-script
```

```js
const FetchScript = require("fetch-script");
const fetchScript = new FetchScript({
  apis: {
    jph: { baseUrl: "http://jsonplaceholder.typicode.com" }
  }
});

fetchScript.on("out", out => {
  console.log("Data out:", out);
});

fetchScript.execute([
  "foos = /jph/users", 
  "/jph/users/{foos[*].id}"
]);
```

## API

### Constructor options

#### `apis`
This is where you define APIs. For instance, to define an API named "jph":

```js
new FetchScript({
  apis: {
    jph: { baseUrl: "http://jsonplaceholder.typicode.com" }
  }
});
```

**`baseUrl`**: String. Mandatory. A base url to prepend to API paths

### `execute(String | Array<String>)`
Execute one or mutiple commands. See examples.


### Events

#### `out`
Equivalent of stdout.

Example:
```js
{
  resource: "/api/user/1",
  data: {id: 1, name: "Michael"}
}
```


#### `error`
Equivalent of stderr.

Example:
```js
{
  resource: "/api/user/1",
  error: <Error object>
}
```

