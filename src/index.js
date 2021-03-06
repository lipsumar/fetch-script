const EventEmitter = require("events");
const _ = require("lodash");
const lexer = require("./lexer");
const parser = require("./parser");
const Interpreter = require("./interpreter");

module.exports = class FetchScript extends EventEmitter {
  constructor(opts) {
    super();
    this.opts = opts || {};
    this.interpreter = new Interpreter(this.opts);
    this.axios = this.interpreter.axios // expose axios for mocks in testing
    this.interpreter.on("resource", res => {
      this.emit("interpreter:resource", res);
    });
    this.interpreter.on("output", res => {
      this.emit("out", res);
    });
    this.interpreter.on("resource", res => {
      this.emit("resource", res);
    });
    this.interpreter.on("set-option", res => {
      this.emit("set-option", res);
    });
  }

  setVariables(vars){
    this.interpreter.setVariables(vars)
  }

  executeCode(code) {
    let ast
    try {
      const tokens = this.lex(code);
      ast = this.parse(tokens);
    } catch (err) {
      throw new Error('Syntax Error: '+err.message)
    }

    if(this.opts.debug){
      console.dir(ast, { depth: 10, colors: true })
    }

    let prom
    try {
      prom = this.interpreter
        .interpret(ast)
        .then(out => {
          return out;
        })
    } catch (err) {
      throw new Error('Runtime error: '+err.message)
    }

    return prom;
  }

  lex(code) {
    return lexer.lex(code);
  }

  parse(tokens) {
    return parser.parse(tokens);
  }

  getVars() {
    return this.interpreter.vars;
  }
};
