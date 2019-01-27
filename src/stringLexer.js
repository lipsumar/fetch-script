const Lexer = require('lex')

module.exports = {
  lex(code) {
    const lexer = new Lexer((unexpcted) => {
      if (inJs) {
        tokens.push({
          type: 'js',
          value: unexpcted
        })
      } else {
        throw new Error('Unexpected char "' + unexpcted + '"');
      }

    })
    const tokens = []

    lexer.addRule(/\s/, lexeme => {
      tokens.push({
        type: 'string',
        value: lexeme
      })
    })

    lexer.addRule(/\{.+?\}/g, lexeme => {
      tokens.push({
        type: 'expression',
        value: lexeme
      })
    })

    lexer.addRule(/[^\s{]+/, lexeme => {
      tokens.push({
        type: 'string',
        value: lexeme
      })
    })


    try {
      lexer.setInput(code).lex()
    } catch (err) {
      console.error('Lex error: ' + err.message);
      console.log(err)
    }
    tokens.push('EOL')

    return this.post(tokens)
    //console.log('End lex')
  },

  post(tokens) {
    let inString = false
    return tokens.reduce((memo, token) => {
      if (token.type === 'string' && inString === false) {
        inString = token.value
      } else if (token.type === 'string' && inString !== false) {
        inString+=token.value
      } else if ((token.type !== 'string' || token === 'EOL') && inString !== false) {
        memo.push({
          type: 'string',
          value: inString
        })
        memo.push(token)
        inString = false
      } else {
        memo.push(token)
      }

      return memo
    }, [])
    .filter(tokens => tokens!=='EOL')
  }
}
