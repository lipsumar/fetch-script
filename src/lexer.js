const Lexer = require('lex')

module.exports = {
  lex(code){
    const lexer = new Lexer()
    const tokens = []
    
    // comments
    lexer.addRule(/\#.*/, lexeme => {
      console.log('comment', lexeme)
    })

    // symbols
    lexer.addRule(/[a-z\.$_](?:[a-z\.$_0-9]+|)/i, lexeme => {
      tokens.push({
        type: 'symbol',
        value: lexeme
      })
    })

    // subsymbol
    lexer.addRule(/\[[a-z\.$_][a-z\.$_0-9]+\]/i, lexeme => {
      tokens.push({
        type: 'subsymbol',
        value: lexeme.substr(1, lexeme.length - 2)
      })
    })

    // allow whitespace
    lexer.addRule(/\s/, lexeme => {})

    // output
    lexer.addRule(/>.*/, lexeme => {
      tokens.push('>')
      const codeString = lexeme.substr(1).trim()
      tokens.push(this.createCodeToken(codeString))
      tokens.push('EOL')
    })

    // right side of assignment
    lexer.addRule(/=.*/, lexeme => {
      tokens.push('=')
      const codeString = lexeme.substr(1).trim()
      tokens.push(this.createCodeToken(codeString))
      tokens.push('EOL')
    })
    

    try {
      lexer.setInput(code).lex()
    } catch (err) {
      console.error('Lex error: ' + err.message);
      console.log(err)
    }

    return tokens
  },


  createCodeToken(code) {
    if (code[0] === '/') {
      return {
        type: 'resource',
        value: code
      }
    }
    if (code.match(/\{.+?(\*|\.\.).+?\}/)) {
      return {
        type: 'string',
        value: code
      }
    }
    return {
      type: 'js',
      value: code
    }
  }
}