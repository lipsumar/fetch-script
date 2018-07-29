# fetch-script

**DISCLAIMER: This is a work in progress**

> Powerful API fetching with a few keystrokes

## A weird flavor of javascript

```
1.  users = /sample/users
2.  all = /sample/users/{users[*].id}
3.    [posts] = /sample/posts/?userId={@.id}
4.
5.  for user in all:
6.    > user.name + ': ' + user.posts.length + ' posts'
```

Fetch-script is made to create small programs to fetch data. The code above does the following:

1. GET request to an API defined as "sample" on path `/users`
2. As many GET requests to path `/users/<id>`
3. For each item in `all`, GET request to `/sample/posts/?userId=<id>` and assign result to each item's `.posts` property
4.
5. A loop
6. Output a line

It can be used as a [CLI tool](https://github.com/lipsumar/fetch-script-cli), including an interactive mode.

There is also a [web-app](https://github.com/lipsumar/fetch-script-app)

## Language reference

The language is mostly javascript, with a heavy amount of sugar on top.

### Fetch-script resource
The core of fetch-script are resources. A resource looks like this:

```
/api/path
```

It starts with a `/`, directly followed by the name of the API (see how to define APIs), then the path.

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

# only objects can be on multiple lines
obj = {
  foo: "bar"
}
```

#### Sub-assignment

Resources support "sub-assignment".

```
users = /sample/users
  [posts] = /sample/posts?user={@.id}
```

Right after assigning a resource, a sub-assignment can be made. The previously assigned var will be used as a loop (in this case `users`) and will execute the sub-assignment for each item. The expression in `{}` is javascript where `@` represents the current item in the loop.

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

fetchScript.executeCode(`
  foos = /jph/users
  > /jph/users/{foos[*].id}
`).then(res => {
  console.log(res)
})
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

### `executeCode(String)`
Execute fetch-script code, returns a promise.


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

