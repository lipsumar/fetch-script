module.exports = {
  uniqueFilter(value, index, self) {
    return self.indexOf(value) === index;
  },

  hasVariables(str) {
    const m = /\{([^{]+)\}/g.exec(str);
    return !!(m && m[1]);
  },

  drawprogressBar(current, total) {
    const width = 30
    const pc = current / total
    const done = width * pc
    return '[' + '='.repeat(done) + ' '.repeat(width - done) + '] ' + current + '/' + total
  }
};
