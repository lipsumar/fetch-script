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
    let inJs = false
    let inOutput = false
    lexer.addRule(/\#.*/, lexeme => {
      console.log('comment', lexeme)
    })

    lexer.addRule(/\n/, lexeme => {
      //console.log('EOL')
      tokens.push('EOL')
      inJs = false
      inOutput = false
    })

    lexer.addRule(/\s/, lexeme => {
      tokens.push({
        type: 'string',
        value: lexeme
      })
    })

    lexer.addRule(/=/, lexeme => {
      //console.log('=')
      tokens.push('=')
      inJs = true
    })

    lexer.addRule(/>/, lexeme => {
      tokens.push('>')
      inOutput = true
    })

    lexer.addRule(/\/.+/i, lexeme => {
      //console.log('resource', lexeme)
      tokens.push({
        type: 'resource',
        value: lexeme
      })
      inJs = false
    })
    //lexer.addRule(/\{.+?(\*|\.\.).+?\}/g, lexeme => {
    lexer.addRule(/\{.+?\}/g, lexeme => {
      //console.log('expression', lexeme)
      tokens.push({
        type: 'expression',
        value: lexeme
      })
    })


    lexer.addRule(/\[[a-z\.$_][a-z\.$_0-9]+\]/i, lexeme => {
      //console.log('subsymbol', lexeme)
      tokens.push({
        type: 'subsymbol',
        value: lexeme.substr(1, lexeme.length - 2)
      })
    })

    lexer.addRule(/[^\s{]+/, lexeme => {
      //console.log('string', lexeme)
      tokens.push({
        type: inJs ? 'js' : 'string',
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
/*
  post(tokens) {
    let inJs = false
    return tokens.reduce((memo, token, i) => {
      
      if (token.type === 'js' && !inJs) {
        inJs = token.value
      } else if (token.type==='js' && inJs) {
        inJs+=token.value
      } else if (token === 'EOL' && inJs) {
        memo.push({
          type: 'js',
          value: inJs
        })
        inJs = false
        memo.push(token)
      } else {
        memo.push(token)  
      }
      
      return memo
    }, [])
  }*/
}
