# fetch-script

**DISCLAIMER: This is a work in progress**

> A language to talk to HTTP APIs


## A weird flavor of javascript

```
1.  $options.apis.sample.baseURL = "http://jsonplaceholder.typicode.com"
2.  users = /sample/users
3.  all = /sample/users/{users[*].id}
4.    [posts] = /sample/posts/?userId={@.id}
5.
6.  for user in all:
7.    > user.name + ': ' + user.posts.length + ' posts'
```

Fetch-script is made to create small programs to fetch data. The code above does the following:

1. Register an API called "sample"
2. GET request API "sample" on path `/users`, assigned *synchronously* to `users`
3. For each item in `users`, GET requests to path `/users/<id>`
4. For each item in `all`, GET request to `/sample/posts/?userId=<id>` and assign result to each item's `.posts` property
5.
6. A loop
7. Output a line

It can be used as a [CLI tool](https://github.com/lipsumar/fetch-script-cli) or as a [web-app](https://github.com/lipsumar/fetch-script-app)

-----

* [**Language reference**](#language-reference)
  * [Fetch-script resource](#fetch-script-resource)
    * [Expanded resources](#expanded-resources)
  * [Assignment](#assignment)
    * [Sub-assignment](#sub-assignment)
  * [Output](#output)
  * [Control structures](#control-structures)
    * [Conditions](#conditions)
    * [Loops](#loops)
  * [$options](#options)
    * [Registering APIs](#registering-apis)
    * [Configuring API routes](#configuring-api-routes)
* [**Usage**](#usage)
* [**API**](#api)





## Language reference

The language is mostly javascript, with a heavy amount of sugar on top.

### Fetch-script resource
The core of fetch-script are resources. A resource looks like this:

```
/api/path
```

It starts with a `/`, directly followed by the name of the API, then the path. (see [Registering APIs](#registering-apis)).

A resource can be assigned to a variable:

```
users = /api/users
> users[1].name
```

The response (JSON or XML) will be assigned *synchronously* to the variable. It can be immediatly used.

#### Expanded resources

Resources can be "expanded". For instance, consider you want to fetch the profile of many users, you would need to do:

```
/api/profile?user=1
/api/profile?user=2
/api/profile?user=3
...
```

This can be done this way:

```
users = [{id: 1}, {id: 2}, {id: 3}]
profiles = /api/profile?user={users[*].id}
```

Between curly braces is a [jsonpath](http://jsonpath.com/) expression. `profiles` will contain an array with the 3 profiles.

Simple variables can also be used in curly braces and will also be expanded if arrays:

```
ids = [1, 2, 3]
profiles = /api/profile?user={ids}

mike = 4
one_profile = /api/profile?user={mike}
```


### Assignment

Any javascript expression can be assigned, as well as fetch-script resources.

Unlike javascript, no `var`, `const` or `let` is needed: all variables are global.

```
foo = "bar"
baz = [1, 2, 3].map(n => n*2)
users = /my-api/users

# only code between `{}` can be on multiple lines, such as objects or functions:
obj = {
  foo: "bar"
}

foo = () => {
  return 'hello'
}
```

#### Sub-assignment

Resources support "sub-assignment".

```
users = /sample/users
  [posts] = /sample/posts?user={@.id}
```

Right after assigning a resource, a sub-assignment can be made. The previously assigned variable will be used as a loop (in this case `users`) and will execute the sub-assignment for each item. The expression in `{}` is javascript where `@` represents the current item in the loop.

The example above is the same as:

```
users = /sample/users
for user in users:
  user.posts = /sample/posts?user={user.id}
```

### Output

Any javascript expression can be outputed, as well as fetch-script resources.

```
foo = "world"
> "hello"
> foo
> /sample/users
```

### Control structures

Control structures in Fetch-script use the python flavor:

#### Conditions
```
if foo:
  > foo + "is true"
else:
  > foo + "is not true"
```

#### Loops
```
stuff = [1, 2, 3]
for i in stuff:
  > 'stuff ' + i
```

Fetch-script currently only supports 1 level of nesting.

### $options

`$options` is a special variable used to configure fetch-script at runtime.

#### Registering APIs

In order to perform requests, APIs must be registered. Each API is associated to a name. The only required option is `baseURL`.

Here we register an API under the name "sample":

```
// Register an api called "sample"
$options.apis.sample.baseURL = "http://jsonplaceholder.typicode.com"
```

From now on this API can be called by its name followed by a route:

```
> /sample/users
```

This will translate into `GET http://jsonplaceholder.typicode.com/users`.




All options from [axios](https://github.com/axios/axios#request-config) are supported:

```
// Register an api called "gitlab" with specific headers
$options.apis.gitlab.baseURL = "https://git.my-company.com/api/v4"
$options.apis.gitlab.headers = {'Private-token': 'xxxxxxxxxx'}
```

#### Configuring API routes

Some routes might return responses like:

`/sample/users`

```json
{
  "info": {
    "responseTime": 210,
    "totalResults": 920
  },
  "users": [
    {"id": 1, "name": "Helen"},
    {"id": 2, "name": "John"},
    // ...
  ]
}
```

To make working with this route easier, you can specify pagination and accessor:

```
// register an accessor so Fetch-script knows how to find the actual items
$options.apis.sample.route.users.accessor = resp => resp.data.users

// register a paginator so Fetch-script knows how to get the next page
// it should return the next resource to fetch
$options.apis.sample.route.users.paginator = (resp, page) => {
  return resp.data.users.length > 0 ? '/sample/users?page=' + (page+1) : null
}
```



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

### As a node module

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

fetchScript.executeCode(`
  foos = /jph/users
  > /jph/users/{foos[*].id}
`).then(outputs => {
  console.log(outputs) // all outputs as an array
  console.log(fetchScript.getVars()) // an object holding all variables
})
```

## API

### Constructor options

#### `apis`

This is where you can also register APIs. For instance, to register an API named "jph":

```js
new FetchScript({
  apis: {
    jph: { baseUrl: "http://jsonplaceholder.typicode.com" }
  }
});
```

**`baseUrl`**: String. Mandatory. A base url to prepend to API paths

### `executeCode(String)`
Execute fetch-script code, returns a Promise.


### Events

#### `out`
Equivalent of stdout.


#### `error`
Equivalent of stderr.
