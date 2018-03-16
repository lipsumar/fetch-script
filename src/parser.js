module.exports = {
  parse(tokens) {
    console.log(tokens)
    const tree = {
      type: 'statements',
      statements: []
    }
    let currentStatement = null
    tokens.forEach((token, i) => {
      const prev = i > 0 ? tokens[i - 1] : null
      const next = i < tokens.length - 1 ? tokens[i + 1] : null

      if (!currentStatement && token.type === 'symbol' && next === '=') {
        currentStatement = {
          type: 'assignment',
          symbol: token.value
        }
      }
      if (currentStatement && prev === '=') {
        currentStatement.value = token
        return;
      }

      if (!currentStatement && token.type === 'symbol' && next === 'EOL') {
        currentStatement = {
          type: 'js',
          value: token.value
        }
        return;
      }

      if (token.type === 'die') {
        currentStatement = {
          type: 'die'
        }
        return;
      }

      if (!currentStatement && prev === 'EOL' && token.type === 'string' && next === 'EOL') {
        currentStatement = {
          type: 'js',
          value: token.value
        }
      }
      
      if (token.type === 'subsymbol' && next === '=') {
        currentStatement = {
          type: 'subassignment',
          subsymbol: token.value,
        }
        return;
      }
      
      if (currentStatement && currentStatement.type === 'output' && token!='EOL') {
        currentStatement.values.push(token)
        return;
      }
    
      if (!currentStatement && prev === '>') {
        currentStatement = {
          type: 'output',
          value: token
        }
      }
      


      if (token === 'EOL' && currentStatement) {
        tree.statements.push(currentStatement)
        currentStatement = null
      }
    })

    console.dir(tree, { depth: 10, colors: true })
    return tree

  }
}