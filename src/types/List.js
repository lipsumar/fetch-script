
module.exports = class TypeList extends Array {

  constructor(resources) {
    if (resources instanceof Array) {
      super(...resources)  
    } else {
      super()
    }    
  }

  get(index) {
    return this[index]
  }

  first() {
    return this.get(0)
  }

  toString() {
    return "List[" + this.length + "]";
  }
};
