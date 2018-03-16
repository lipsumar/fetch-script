module.exports = {
  parse(tokens) {
    console.log(tokens)
    let tree = {
      type: 'statements',
      statements: []
    }
    const rootTree = tree
    let currentStatement = null
    let currentIndent = 0
    tokens.forEach((token, i) => {
      const prev = i > 0 ? tokens[i - 1] : null
      const next = i < tokens.length - 1 ? tokens[i + 1] : null

      if (token === 'BLOCKSTART') {
        console.log('swap tree', tree.statements[tree.statements.length - 1])
        tree = tree.statements[tree.statements.length-1]
      }

      if (token.type === 'INDENT') {
        currentIndent = token.value
        return
      }

      if (currentIndent > 0 && prev === 'EOL' && token.type !== 'INDENT') {
        currentIndent = 0
        tree = rootTree
      }

      if (currentStatement && currentStatement.type === 'loop' && token.type === 'keyword' && token.value === 'in') {
        currentStatement.loopOver = next.value
      }

      if (!currentStatement && token.type === 'keyword' && token.value === 'for') {
        currentStatement = {
          type: 'loop',
          loopAs: next.value,
          statements: []
        }
      }

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

    console.dir(rootTree, { depth: 10, colors: true })
    return rootTree

  }
}