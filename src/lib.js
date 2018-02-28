module.exports = {
  uniqueFilter(value, index, self) {
    return self.indexOf(value) === index;
  },

  hasVariables(str) {
    const m = /\{([^{]+)\}/g.exec(str);
    return !!(m && m[1]);
  }
};
