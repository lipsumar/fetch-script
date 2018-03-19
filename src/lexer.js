const Lexer = require('lex')

module.exports = {
  lex(code){
    const lexer = new Lexer()
    const tokens = []
    
    // comments
    lexer.addRule(/\#.*/, lexeme => {
      console.log('comment', lexeme)
    })

    // keywords
    lexer.addRule(/(?:for|in|def|else)/, lexeme => {
      tokens.push({
        type: 'keyword',
        value: lexeme
      })
    })
    lexer.addRule(/if .*/, lexeme => {
      tokens.push({
        type: 'keyword',
        value: 'if'
      })
      const codeString = lexeme.substr(3, lexeme.length-4).trim()
      tokens.push(this.createCodeToken(codeString))
      tokens.push('EOL')
      tokens.push('BLOCKSTART')
    })
    lexer.addRule(/POST [^\{]+/, lexeme => {
      tokens.push({
        type: 'keyword',
        value: 'post'
      })
      const codeString = lexeme.substr(5, lexeme.length - 6).trim()
      tokens.push(this.createCodeToken(codeString))
    })

    // block starts
    lexer.addRule(/\:/, lexeme => {
      tokens.push('EOL')
      tokens.push('BLOCKSTART')
    })

    lexer.addRule(/\{.*/, lexeme => {
      tokens.push({
        type: 'js',
        value: lexeme
      })
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

    // whitespace
    lexer.addRule(/\n/, lexeme => {})
    lexer.addRule(/[ ]+/, lexeme => {
      if (lexeme.length == 2) {
        tokens.push({ type: 'INDENT', value: 1 })
      }
    })

    // output
    lexer.addRule(/> .*/, lexeme => {
      tokens.push({
        type: 'output',
        to: 'stdout'
      })
      const codeString = lexeme.substr(1).trim()
      tokens.push(this.createCodeToken(codeString))
      tokens.push('EOL')
    })
    // output to file
    lexer.addRule(/>.*/, lexeme => {
      const parts = lexeme.split(' ')
      tokens.push({
        type: 'output',
        to: parts.shift().substr(1)
      })
      const codeString = parts.join(' ')
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

    lexer.addRule(/die\(\)/, () => {
      tokens.push({type:'die'})
    })

    try {
      const pre = this.pre(code)
      lexer.setInput(pre).lex()
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
  },

  pre(code) {
    const lines = code.split('\n') 
    const newLines = []
    let buffer = null
    let endBoundary = null
    lines.forEach(line => {
      if (buffer) {
        buffer.push(line)
        if (line === endBoundary) {
          endBoundary = null
          newLines.push(buffer.join(''))
          buffer = null
        }
        return
      }
      
      if (line[line.length - 1] === '{') {
        buffer = [line]
        endBoundary = '  '.repeat(this.indentSize(line)) + '}'
        return
      }

      newLines.push(line)
    })
    return newLines.join('\n')
  },

  indentSize(line) {
    const m = line.match(/^ +/g)
    if(!m) return 0
    return m[0].length / 2
  }
}