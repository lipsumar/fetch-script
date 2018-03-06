const Promise = require("bluebird");
const EventEmitter = require("events");
const _ = require("lodash");
const lexer = require("./lexer");
const parser = require("./parser");
const Interpreter = require("./interpreter");
const TypeList = require("./types/List");

module.exports = class FetchScript extends EventEmitter {
  constructor(opts) {
    super();
    this.opts = opts || {};
    this.vars = {};
  }

  executeCode(code) {
    const tokens = this.lex(code);
    const ast = this.parse(tokens);
    const interpreter = new Interpreter();
    interpreter.on('resource', res => {
      this.emit('interpreter:resource', res)
    })
    return interpreter
      .interpret(ast)
      .then(out => {
        console.log("done!");
        //console.dir(interpreter.vars, {colors: true, depth: 3})
        out.forEach(outLine => {
          if (outLine instanceof TypeList) {
            console.log(outLine);
          } else if (outLine instanceof Array) {
            console.log(outLine.join("\n"));
          } else {
            console.log(outLine);
          }
        });
        return out;
      })
      .catch(err => {
        console.log("error!", err.message);
      });
  }

  lex(code) {
    return lexer.lex(code);
  }

  parse(tokens) {
    return parser.parse(tokens);
  }
};
