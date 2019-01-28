const Promise = require("bluebird")
const EventEmitter = require("events")
const axios = require("axios")
const xml2js = require('xml2js')
const xmlParser = new xml2js.Parser()
const parseXML = xmlParser.parseString
const TypeList = require('../types/List')

module.exports = class ModuleResource extends EventEmitter {
  constructor(apisConfig){
    super()
    this.axios = axios.create()
    this.apisConfig = apisConfig
  }

  run(expanded, list = new TypeList()) {
    let resource = expanded[0]
    const resourceParts = resource.split(' ')
    resource = resourceParts[0]
    const paginationMode = resourceParts[1]

    const resourceConfig = this.resourceToRequest(resource)
    if (resourceConfig.paginator && paginationMode!=='1') {
      if (expanded.length > 1) {
        throw new Error('can not paginate an expanded resource')
      }
      return this.resource(expanded[0]).then(data => {
        const dataOri = data
        console.log(data)
        //console.log('pushing to list', list.length)
        try {
          data = resourceConfig.accessor ? resourceConfig.accessor(data) : data
        } catch (err) {
          return list
        }
        if (typeof data !== 'undefined') {
          list.addPage(data)
        }
        if (paginationMode && list.length >= paginationMode) {
          //console.log('LIMIT of '+paginationMode+' reached')
          return list.slice(0, paginationMode)

        }
        const nextResource = resourceConfig.paginator(dataOri, list.page)
        //console.log('next res', nextResource)
        if (nextResource) {
          console.log({nextResource})
          return this.run(nextResource + ' ' + paginationMode, list)
        } else {
          //console.log('returning list', list.length)
          return list
        }
      })

    } else {
      return Promise.all(
        Promise.resolve(expanded).map(this.resource.bind(this), {concurrency: 20})
      ).then(res => {
        return expanded.length === 1 ? res[0] : new TypeList(res)
      })
    }

  }


  resourceToRequest(resourceString) {
    console.log({resourceString})
    const [resource, options] = resourceString.split(' ')
    const parts = resource.split("/");
    const apiIdentifier = parts[1];
    const routeIdentifier = parts[2];
    const apiConfig = this.apisConfig[apiIdentifier]
    let routeConfig = {}

    if(apiIdentifier === 'http:'){
      parts.shift();
      return {
        url: parts.join("/")
      }
    }

    if (!this.apisConfig[apiIdentifier]) {
      throw new Error(`API "${apiIdentifier}" is not defined`)
    }

    if (this.apisConfig[apiIdentifier].route && this.apisConfig[apiIdentifier].route[routeIdentifier]) {
      routeConfig = this.apisConfig[apiIdentifier].route[routeIdentifier]
    }

    if(routeConfig.route){
      // meta route
      const request = {
        url: routeConfig.route,
        ...Object.assign({}, apiConfig, routeConfig)
      }
      delete request.route // came from apiConfig, irrelavant for a single route
      return request
    }


    parts.shift();
    parts.shift();
    const request = {
      url: parts.join("/"),
      ...Object.assign({}, apiConfig, routeConfig)
    }
    delete request.route // came from apiConfig, irrelavant for a single route


    return request
  }


  resource(resource) {
    const req = this.resourceToRequest(resource)
    if (req.module) {
      const resParts = resource.split('?')
      let params = {}
      if (resParts[1]) {
        params = resParts[1].split('&').map(kv => kv.split('=')).reduce((m, kv) => {
          m[kv[0]] = kv[1]
          return m
        },{})
      }
      return req.module({params})
    }
    console.log('request->', req)
    return this.axios.request(req).then(data => {
      if (typeof data.data === 'string' && data.data[0] === '<') { // smells like xml
        return new Promise((resolve,reject) => {
          parseXML(data.data, (err, parsed) => {
            if (err) return reject(err)
            return resolve(parsed)
          })
        })
      }

      return data.data;
    })
      .catch((err, data) => {
        return err.response.data
    })
      .then(out => {
      this.emit('resource', {resource, out})
      return out
    })
  }
}

