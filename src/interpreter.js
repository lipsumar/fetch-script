const Promise = require("bluebird");
const EventEmitter = require("events");
const lib = require("./lib");
const deepGetSet = require("deep-get-set");
const dotty = require("dotty");
const {JSONPath} = require("jsonpath-plus");
deepGetSet.p = true
const axios = require("axios"); //@TODO move to module
const xml2js = require('xml2js')//@TODO move to module
const xmlParser = new xml2js.Parser()
const parseXML = xmlParser.parseString
const TypeList = require('./types/List')
const stringLexer = require('./stringLexer')
const fs = require('fs')
//const moduleCsv = require('./modules/csv.js')



module.exports = class FetchScriptInterpreter extends EventEmitter {

  constructor(opts) {
    super();
    this.vars = {
      //...moduleCsv.vars
    }
    this.axios = axios.create()
    this.opts = Object.assign({ apis: {} }, opts || {})
    this.outs = []
  }

  setVariables(vars){
    Object.assign(this.vars, vars)
  }

  interpret(ast, opts) {
    this.outs = []
    if (ast.type === "statements") {
      return this.runStatements(ast.statements)
    }
  }

  runStatements(statements) {
    let i = 0
    const next = () => {
      if (i === statements.length || this.stop) {
        return Promise.resolve(this.outs)//.filter(o => typeof o !== 'undefined'))
      }
      return this.runStatement(statements[i]).then((out) => {
        //this.outs.push(out)
        i++
        return next()
      })
    }
    return next()
  }

  runStatement(statement) {
    switch (statement.type) {
      case 'assignment':
        return this.runAssignment(statement)
      case 'symbol':
        return this.symbol(statement.value)
      case 'output':
        return this.runStatement(statement.value)
          .then(out => {
            if (statement.to === 'stdout') {
              this.outs.push(out)
              this.emit('output', out)
            } else {
              return new Promise((resolve,reject) => {
                fs.writeFile(
                  this.runJavascript(statement.to, true),
                  typeof out === 'string' ? out : JSON.stringify(out),
                  'utf8',
                  (err) => {
                    if (err) {
                      reject(err)
                    } else {
                      this.emit('output-file', { out, to: statement.to })
                      resolve(out)
                    }
                  }
                )
              })
            }

            return out
          })
      case 'resource':
        return this.runResource(statement.value)
      case 'js':
        return this.runJavascript(statement.value)
      case 'expression':
        // @TODO move parsing to parser
        const parts = statement.value.split('')
        parts.pop()
        parts.shift()
        return this.resolveExpression(parts.join('')).then(r => {
          if (r instanceof Array) {
            return r.length === 1 ? r[0] : r
          } else {
            return [r]
          }
        })
      case 'subassignment':
        return this.runSubAssignment(this.lastAssignedSymbol, statement.subsymbol, statement.value)
      case 'string':
        // transform value into distinct statements
        const subStatements = stringLexer.lex(statement.value)
        return Promise.resolve(subStatements.map(t => t.value))
          .mapSeries(this.runString.bind(this))
          .then(out => {
            return this.mergeOutputArrays(out).map(ar => ar.join('')).join('\n')
          })
      case 'loop':
        return this.runLoop(statement)
      case 'condition':
        return this.runCondition(statement)
      case 'die':
        this.stop = true
        return Promise.resolve()
      default:
        return Promise.resolve(statement.value)
    }
  }

  runAssignment(statement) {
    this.lastAssignedSymbol = statement.symbol
    return this.assign(statement.symbol, statement.value)
  }

  runSubAssignment(symbol, subsymbol, statement) {
    const toAssign = this.vars[symbol]
    //console.log('running ' + symbol + '[' + subsymbol + '] = ', statement.value)
    let done = 0
    return Promise.all(
      Promise.resolve(toAssign).map((a, i) => {
        const replacedStatement = Object.assign({}, statement)
        replacedStatement.value = statement.value.split('@').join(symbol + '[' + i + ']') //replace(/@/, symbol + '[' + i + ']')
        return this.runStatement(replacedStatement).then(out => {
          done++
          process.stdout.write(' ' + lib.drawprogressBar(done, toAssign.length) +'        \r')
          return out
        })
      }, {concurrency:10})
    ).then(results => {
      process.stdout.write(' '.repeat(process.stdout.columns-1)+'\r')
      //console.log('')
      toAssign.forEach((a, i) => {
        toAssign[i][subsymbol] = results[i]
      })
    })
    return this.runStatement(statement).then(out => {
      this.vars[symbol][subsymbol] = out
    })
  }

  runResource(resource, list = new TypeList()) {
    const resourceParts = resource.split(' ')
    resource = resourceParts[0]
    const paginationMode = resourceParts[1]
    //console.log('-> ', resource)
    const expanded = this.expandResources([resource])
    const resourceConfig = this.resourceToRequest(resource)
    if (resourceConfig.paginator && paginationMode!=='1') {
      if (expanded.length > 1) {
        throw new Error('can not paginate an expanded resource')
      }
      return this.resource(expanded[0]).then(data => {
        const dataOri = data
        //console.log('pushing to list', list.length)
        try {
          data = resourceConfig.accessor ? resourceConfig.accessor(data) : data
        } catch (err) {
          return list
        }
        if (typeof data !== 'undefined') {
          list.addPage(data)
        }
        if (paginationMode && list.length >= paginationMode) {
          //console.log('LIMIT of '+paginationMode+' reached')
          return list.slice(0, paginationMode)

        }
        const nextResource = resourceConfig.paginator(dataOri, list.page)
        //console.log('next res', nextResource)
        if (nextResource) {
          return this.runResource(nextResource + ' ' + paginationMode, list)
        } else {
          //console.log('returning list', list.length)
          return list
        }
      })

    } else {
      return Promise.all(
        Promise.resolve(expanded).map(this.resource.bind(this), {concurrency: 20})
      ).then(res => {
        return expanded.length === 1 ? res[0] : new TypeList(res)
      })
    }

  }

  runString(string) {
    const expanded = this.expandResources([string])
    return Promise.resolve(expanded.length===1 ? expanded[0] : expanded)
  }

  runJavascript(jsCode, sync = false) {
    const args = Object.keys(this.vars)
    args.push('require')
    args.push('return ' + jsCode)
    const argv = Object.keys(this.vars).map(n => this.vars[n])
    //argv.push(require)
    //console.log(jsCode)
    let out = null
    const f = new Function(...args)
    try {
      out = f(...argv)
    } catch (err) {
      throw new Error(`Javascript error: "${err.message}" while interpreting:\n  ${jsCode.split('\n').join('\n  ')}`)
      out = err
    }

    return sync ? out : Promise.resolve(out)
  }

  runLoop(statement) {
    return Promise.resolve(this.vars[statement.loopOver])
      .mapSeries(item => {
        this.vars[statement.loopAs] = item
        return this.runStatements(statement.statements)
      })
  }

  runCondition(statement) {
    const pass = this.runJavascript(statement.test, true)
    if (pass) {
      return this.runStatements(statement.statements)
    }
    return Promise.resolve()
  }

  expandResources(resources) {
    while (resources.filter(r => lib.hasVariables(r)).length > 0) {
      resources = this.insertVariables(resources);
    }
    return resources
  }

  insertVariables(strs) {
    let inserteds = [];
    strs.forEach(str => {
      const m = /\{([^{]+)\}/g.exec(str);
      let inserted = null;

      if (m && m[1]) {
        const expr = m[1];
        const value = this.resolveExpression(expr, true);

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

  mergeOutputArrays(outs) {
    //console.log('====>',outs)
    const arrayMaster = outs.find(o => o instanceof Array)
    return arrayMaster.map((master, i) => {
      return outs.map(o => {
        if (o instanceof Array) {
          return o[i]
        }
        return o
      })
    })
  }

  resolveExpression(expression, sync = false) {
    // expression is simply a variable name
    if (typeof this.vars[expression] !== "undefined") {
      if (sync) return this.vars[expression]
      return Promise.resolve(this.vars[expression]);
    }

    // expression is probably json path
    try {
      const values = JSONPath("$." + expression, this.vars);
      if (sync) return values
      return Promise.resolve(values);
    } catch (err) { 
      console.log(err)
    }
  }


  assign(symbol, statement) {
    return this.runStatement(statement).then(out => {
      if (symbol[0] === '$') {
        if (symbol === '$') {
          throw new Error('Forbidden to assign to $')
        }
        const parts = symbol.split('.')
        parts.shift()
        deepGetSet(this.opts, parts.join('.'), out)
        this.emit('set-option', {
          key: parts.join('.'),
          data: out
        })
      } else {
        //deepGetSet(this.vars, symbol, out)
        //traverse(this.vars).set(symbol, out)
        symbol = symbol.replace(/\[([0-9]+)\]/, '.$1')
        dotty.put(this.vars, symbol, out)
      }

    })
  }

  symbol(symbol) {
    return Promise.resolve(
      typeof this.vars[symbol] !== 'undefined' ? this.vars[symbol] : symbol
    )
  }

  resource(resource) {
    const req = this.resourceToRequest(resource)
    if (req.module) {
      const resParts = resource.split('?')
      let params = {}
      if (resParts[1]) {
        params = resParts[1].split('&').map(kv => kv.split('=')).reduce((m, kv) => {
          m[kv[0]] = kv[1]
          return m
        },{})
      }
      return req.module({params})
    }
    //console.log('request->', req)
    return this.axios.request(req).then(data => {
      if (typeof data.data === 'string' && data.data[0] === '<') { // smells like xml
        return new Promise((resolve,reject) => {
          parseXML(data.data, (err, parsed) => {
            if (err) return reject(err)
            return resolve(parsed)
          })
        })
      }

      return data.data;
    })
      .catch((err, data) => {
        return err.response.data
    })
      .then(out => {
      this.emit('resource', {resource, out})
      return out
    })
  }

  resourceToRequest(resource) {
    const parts = resource.split("/");
    const apiIdentifier = parts[1];
    const routeIdentifier = parts[2];
    const apiConfig = this.opts.apis[apiIdentifier]
    let routeConfig = {}

    if (!this.opts.apis[apiIdentifier]) {
      throw new Error(`API "${apiIdentifier}" is not defined`)
    }

    if (this.opts.apis[apiIdentifier].route && this.opts.apis[apiIdentifier].route[routeIdentifier]) {
      routeConfig = this.opts.apis[apiIdentifier].route[routeIdentifier]
    }
    parts.shift();
    parts.shift();
    const config = {
      url: parts.join("/"),
      ...Object.assign({}, apiConfig, routeConfig)
    }
    delete config.route
    return config
  }
};
