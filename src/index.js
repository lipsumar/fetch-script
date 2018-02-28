const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Promise = require("bluebird");
const jsonpath = require("jsonpath");
const chalk = require("chalk"); //@TODO move to -cli
const lib = require("./lib");
const EventEmitter = require("events");
const _ = require("lodash");
const deepGetSet = require("deep-get-set");
deepGetSet.p = true

module.exports = class FetchScript extends EventEmitter {
  constructor(opts) {
    super();
    this.opts = opts || {};
    this.vars = {};
  }

  execute(paths) {
    paths = paths instanceof Array ? paths : [paths];

    return Promise.resolve(paths).mapSeries(p => {
      return this._execute(p);
    });
  }

  /**
   * Executes a user command
   * @param {string} p The user command
   */
  _execute(p) {
    if (p[0] === "#") {
      return Promise.resolve();
    }

    this.emit("command", { command: p });

    if (p.substr(0, 5) === "$set ") {
      const parts = p.split(" ");
      const value = parts.slice(2).join(" ");
      deepGetSet(this.opts, parts[1], value);
      this.emit("set-option", {
        key: parts[1],
        data: value
      });
      return Promise.resolve();
    }

    if (p.substr(0, 5) === "$get ") {
      const value = deepGetSet(this.opts, p.substr(5));
      this.emit("out", {
        resource: "$opts",
        data: value
      });
      return Promise.resolve();
    }

    let resource = p;
    let varName = null;
    if (p.includes(" = ")) {
      [varName, resource] = p.split(" = ");
    }
    resource = [resource];

    while (resource.filter(r => lib.hasVariables(r)).length > 0) {
      resource = this.insertVariables(resource);
    }

    return Promise.all(
      resource.map(res => {
        return this.fetchContent(res)
          .then(data => {
            if (varName) {
              if (typeof this.vars[varName] !== "undefined") {
                throw new Error("appending to variables not implemented");
              }
              this.vars[varName] = data;
              this.emit("set-var", {
                varName,
                data
              });
            } else {
              // stdout
              this.emit("out", {
                resource: res,
                data
              });
            }
          })
          .catch(err => {
            this.emit("error", {
              resource: res,
              error: err
            });
          });
      })
    );
  }

  insertVariables(strs) {
    let inserteds = [];
    strs.forEach(str => {
      const m = /\{([^{]+)\}/g.exec(str);
      let inserted = null;

      if (m && m[1]) {
        const expr = m[1];
        const value = this.resolveExpression(expr);
        if (value instanceof Array) {
          inserted = value.map(v => str.split(m[0]).join(v));
        } else {
          inserted = [str.split(m[0]).join(value)];
        }
      } else {
        // nothing to insert
        inserted = [str];
      }
      inserteds = inserteds.concat(inserted);
    });
    return inserteds;
  }

  resolveExpression(expression) {
    // expression is simply a variable name
    if (typeof this.vars[expression] !== "undefined") {
      return this.vars[expression];
    }

    // expression is json path
    const values = jsonpath.query(this.vars, "$." + expression);
    return values.filter(lib.uniqueFilter);
  }

  fetchContent(resource) {
    if (resource[0] !== "/") {
      return Promise.resolve(resource);
    }

    const url = this.expandUrl(resource);

    console.log(chalk.dim("  -> fetch " + url));
    return axios.get(url).then(data => {
      return data.data;
    });
  }

  expandUrl(resource) {
    const parts = resource.split("/");
    const apiIdentifier = parts[1];
    parts.shift();
    parts.shift();
    return this.opts.apis[apiIdentifier].baseUrl + "/" + parts.join("/");
  }

  getVars() {
    return _.cloneDeep(this.vars);
  }
};
