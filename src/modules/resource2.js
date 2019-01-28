const Promise = require('bluebird')
const EventEmitter = require('events')
const axios = require('axios')
const xml2js = require('xml2js')
const xmlParser = new xml2js.Parser()
const parseXML = xmlParser.parseString
const TypeList = require('../types/List')

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE']

module.exports = class ModuleResource extends EventEmitter {
  constructor (apisConfig, runJavascript) {
    super()
    this.axios = axios.create()
    this.apisConfig = apisConfig
    this.runJavascript = runJavascript
  }

  /**
   * The public method for this module, used by the interpreter
   * @param {array} expanded array of resourceString
   */
  run (expanded) {
    return Promise.resolve(expanded)
      .map(this.resource.bind(this), { concurrency: 20 })
      .then(res => {
        return expanded.length === 1 ? res[0] : new TypeList(res)
      })
  }

  /**
   * Executes a resource and return results
   * A resourceString can be:
   * - `/sample/users`
   * - `/sample/users/1`
   * - `/sample/users 2`
   * - `/sample/users {limit:2}`
   * - `POST /sample/users {name:'Bartok'}`
   * @param {string} resourceString
   */
  resource (resourceString) {
    const resource = this.createResource(resourceString)
    const request = this.createRequest(resource)
    if (request.paginator) {
      return this.paginateRequest(request)
    }
    return this.executeRequest(request)
  }

  executeRequest (request) {
    // console.log('->', request)
    return this.axios.request(request)
      .then(resp => this.responseToJson(resp.data))
      .catch((err, data) => {
        // @TODO: this will also catch an XML parse error
        // we only want to catch HTTP errors here
        return err.response.data
      })
  }

  paginateRequest (request, list = new TypeList()) {
    return this.executeRequest(request).then(data => {
      list.addPage(data)
      const nextResourceString = request.paginator(data, list.page)
      if (nextResourceString) {
        const nextResource = this.createResource(nextResourceString)
        const nextRequest = this.createRequest(nextResource)
        nextRequest.paginator = request.paginator
        return this.paginateRequest(nextRequest, list)
      }
      return list
    })
  }

  /**
   * Converts any response body into JSON
   * @param {string} body
   */
  responseToJson (body) {
    if (typeof body === 'string' && body[0] === '<') { // smells like xml
      return new Promise((resolve, reject) => {
        parseXML(body, (err, parsed) => {
          if (err) return reject(err)
          return resolve(parsed)
        })
      })
    }

    return body
  }

  createResource (resourceString) {
    const parts = resourceString.split(' ')

    let method = 'GET'
    if (this.isHttpMethod(parts[0])) {
      method = parts.shift()
    }

    const url = parts.shift()

    const optionsString = parts.join(' ')
    const optionsInt = parseInt(optionsString, 10)
    let options
    if (!isNaN(optionsInt)) {
      options = { limit: optionsInt }
    } else {
      options = this.runJavascript(optionsString)
    }

    return {
      method,
      url,
      options
    }
  }

  createRequest (resource) {
    const resourceUrl = this.parseResourceUrl(resource.url)
    let apiConfig = this.apisConfig[resourceUrl.apiIdentifier]

    if (resourceUrl.apiIdentifier === 'http:' || resourceUrl.apiIdentifier === 'https:') {
      apiConfig = {
        url: resource.url.substring(1)
      }
    }

    if (!apiConfig) {
      throw new Error(`API "${resourceUrl.apiIdentifier}" is not defined`)
    }

    const request = Object.assign({
      method: resource.method,
      url: resourceUrl.route
    }, apiConfig)

    const routeConfig = apiConfig.route && apiConfig.route[resourceUrl.route]
    if (routeConfig && routeConfig.route) {
      request.url = routeConfig.route
    }
    if (routeConfig && routeConfig.paginator) {
      request.paginator = routeConfig.paginator
    }

    return request
  }

  parseResourceUrl (resourceUrl) {
    const parts = resourceUrl.split('/')
    parts.shift()

    const apiIdentifier = parts.shift()
    const route = parts.join('/')

    return {
      apiIdentifier,
      route
    }
  }

  /**
   * @param {string} str
   * @returns {boolean}
   */
  isHttpMethod (str) {
    return HTTP_METHODS.includes(str.toLowerCase())
  }
}
