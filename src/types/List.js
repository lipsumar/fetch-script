
module.exports = class TypeList extends Array {

  constructor(resources) {
    if (resources instanceof Array) {
      super(...resources)
    } else {
      super()
    }
    this.page = 0
  }

  get(index) {
    return this[index]
  }

  first() {
    return this.get(0)
  }

  addPage(items) {
    for (let item of items) {
      this.push(item)
    }
    this.page += 1
    return this
  }

  toString() {
    return "List[" + this.length + "]";
  }
};
