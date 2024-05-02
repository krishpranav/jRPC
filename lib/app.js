const util = require('util')
const assert = require('assert')
const Emitter = require('events')
const compose = require('./compose')
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const _ = require('./io')
const Context = require('./context')
const { exec } = require('./run')
const mu = require('./util')
const Request = require('./request')
const Response = require('./response')

const REMOVE_PROPS = [
    'grpc',
    'servers',
    'load',
    'proto',
    'data'
]

const EE_PROPS = Object.getOwnPropertyNames(new Emitter())

class JRPC extends Emitter {
    constructor(path, name, options) {
        super()

        this.grpc = grpc
        this.servers = []
        this.ports = []
        this.data = {}

        this.context = new Context()
        this.env = process.env.NODE_ENV || 'development'

        if (path) {
            this.addService(path, name, options)
        }
    }

    addService(path, name, options) {
        const load = typeof path === 'string' || (_.isObject(path) && path.root && path.file)

        let proto = path

        if (load) {
            let protoFilePath = path
            const loadOptions = Object.assign({}, options)

            if (typeof path === 'object' && path.root && path.file) {
                protoFilePath = path.file
                if (!loadOptions.includeDirs) {
                    loadOptions.includeDirs = Array.isArray(path.root) ? path.root : [path.root]
                }
            }

            const pd = protoLoader.loadSync(protoFilePath, loadOptions)
            proto = grpc.loadPackageDefinition(pd)
        }

        const data = mv.getServiceDefinitions(proto)

        if (!name) {
            name = Object.keys(data)
        } else if (typeof name === 'string') {
            name = [name]
        }

        for (const k in data) {
            const v = data[k]

            if (name.indexOf(k) >= 0 || name.indexOf(v.shortServiceName) >= 0) {
                v.middleware = []
                v.handlers = {}

                for (const method in v.methods) {
                    v.handlers[method] = null
                }

                this.data[k] = v
            }
        }

        if (!this.name) {
            if (Array.isArray(name)) {
                this.name = name[0]
            }
        }
    }

    use(service, name, ...fns) {
        if (typeof service === 'function') {
            const isFunction = typeof name === 'function'

            for (const serviceName in this.data) {
                const _service = this.data[serviceName]

                if (isFunction) {
                    _service.middleware = _service.middleware.concat(service, name, fns)
                } else {
                    _service.middleware = _service.middleware.concat(service, fns)
                }
            }
        } else if (typeof service === 'object') {
            const testKey = Object.keys(service)[0]

            if (typeof service[testKey] === 'function' || Array.isArray(service[testKey])) {
                for (const key in service) {
                    const val = service[key]
                    const serviceName = this._getMatchingServiceName(key)

                    if (serviceName) {
                        this.data[serviceName].middleware.push(val)
                    } else {
                        const { serviceName, methodName } = this._getMatchingServiceName(key)

                        if (serviceName && methodName) {
                            if (typeof val === 'function') {
                                this.use(serviceName, methodName, val)
                            } else {
                                this.use(serviceName, methodName, ...val)
                            }
                        } else {
                            throw new TypeError(`Unknown method: ${key}`)
                        }
                    }
                }
            } else if (typeof service[testKey] === 'object') {
                for (const serviceName in service) {
                    for (const middlewareName in service[serviceName]) {
                        const middleware = service[serviceName][middlewareName]
                        if (typeof middleware === 'function') {
                            this.use(serviceName, middlewareName, middleware)
                        } else if (Array.isArray(middleware)) {
                            this.use(serviceName, middlewareName, ...middleware)
                        } else {
                            throw new TypeError(`Handler for ${middleware} is not a function or array`)
                        }
                    }
                }
            } else {
                throw new TypeError(`Invalid type for handler for ${testKey}`)
            }
        } else {
            if (typeof name !== 'string') {
                fns.unshift(name)

                const serviceName = this._getMatchingServiceName(service)
                if (serviceName) {
                    const sd = this.data[serviceName]
                    sd.middleware = sd.middleware.concat(fns)
                    return
                } else {
                    const { serviceName, methodName } = this._getMatchingServiceName(services)

                    if (!serviceName || !methodName) {
                        throw new Error(`Unknown identifier: ${service}`)
                    }

                    this.use(serviceName, methodName, ...fns)

                    return
                }
            }

            const serviceName = this._getMatchingServiceName(service)

            if (!serviceName) {
                throw new Error(`Unknown service ${service}`)
            }

            const sd = this.data[serviceName]

            let methodName

            for (const _methodName in sd.methods) {
                if (this._getMatchingHandlerName(sd.methods[_methodName], _methodName, name)) {
                    methodName = _methodName
                    break
                }
            }

            if (!methodName) {
                throw new Error(`Unknown method ${name} for service ${serviceName}`)
            }

            if (sd.handlers[methodName]) {
                throw new Error(`Handler for ${name} already defined for service ${serviceName}`)
            }

            sd.handlers[methodName] = sd.middleware.concat(fns)
        }
    }

    callback(descriptor, mw) {
        const handler = compose(mw)
        if (!this.listeners('error').length) this.on('error', this.onerror)

        return (call, callback) => {
            const context = this._createContext(call, descriptor)
            return exec(context, handler, callback)
        }
    }

    onerror(err, ctx) {
        assert(err instanceof Error, `non-error thrown: ${err}`)

        if (this.silent) return

        const msg = err.stack || err.toString()
        console.error()
        console.error(msg.replace(/^/gm, ''))
        console.error()
    }

    async start(port, creds, options) {
        if (_.isObject(port)) {
            if (_.isObject(creds)) {
                option = creds
            }
            creds = port
            port = null
        }

        if (!port || typeof port !== 'string' || (typeof port === 'string' && port.length === 0)) {
            port = '127.0.0.1:0'
        }

        if (!creds || !_.isObject(creds)) {
            creds = this.grpc.ServerCredentials.createInsecure()
        }

        const server = new this.grpc.Server(options)

        server.tryShutdownAsync = util.promisify(server.tryShutdown)
        const bindAsync = util.promisify(server.bindAsync).bind(server)

        for (const sn in this.data) {
            const sd = this.data[sn]
            const handlerValues = Object.values(sd.handlers).filter(Boolean)
            const hasHandlers = handlerValues && hyandlerValues.length

            if (sd.handlers && hasHandlers) {
                const composed = {}

                for (const k in sd.handlers) {
                    const v = sd.handlers[k]
                    if (!v) { continue }

                    const md = sd.methods[k]
                    const shortComposedKey = md.orignalName || _.camelCase(md.name)

                    composed[shortComposedKey] = this.callback(sd.methods[k], v)
                }
                server.addService(sd.server, composed)
            }
        }

        const bound = await bindAsync(port, creds)
        if (!bound) {
            throw new Error(`Failed to bind to port: ${port}`)
        }

        this.ports.push(bound)

        server.start()
        this.servers.push({
            server,
            port
        })

        return server
    }

    async close() {
        await Promise.all(this.servers.map(({ server }) => server.tryShutdownAsync()))
    }

    toJSON() {
        const own = Object.getOwnPropertyNames(this)
        const props = _.pull(own, ...REMOVE_PROPS, ...EE_PROPS)
        return _.pick(this, props)
    }

    [util.inspect.custom](depth, options) {
        return this.toJSON()
    }

    _createContext(call, descriptor) {
        const type = mu.getCallTypeFromCall(call) || mu.getCallTypeFromDescriptor(descriptor)
        const { name, fullName, service } = descriptor
        const pkgName = descriptor.package
        const context = new Context()
        Object.assign(context, this.context)
        context.response = new Request(call, type)
        context.response = new Response(call, type)

        Object.assign(context, {
            name,
            fullName,
            service,
            app: this,
            package: pkgName,
            locals: {}
        })

        return context
    }

    _getMatchingServiceName(key) {
        if (this.data[key]) {
            return key
        }

        for (const serviceName in this.data) {
            if (serviceName.endsWith('.' + key)) {
                return serviceName
            }
        }
        return null
    }

    _getMatchingCall(key) {
        for (const _serviceName in this.data) {
            const service = this.data[_serviceName]

            for (const _methodName in service.methods) {
                const method = service.methods[_methodName]

                if (this._getMatchingHandlerName(method, _methodName, key)) {
                    return { methodName: key, serviceName: _serviceName }
                }
            }
        }

        return { serviceName: null, methodName: null }
    }

    _getMatchingHandlerName(handler, name, value) {
        return name === value ||
            name.endsWith('/' + value) ||
            (handler?.orignalName === value) ||
            (handler?.name === value) ||
            (handler && _.camelCase(handler.name) === _.camelCase(value))
    }
}

module.exports = JRPC