const CallType = require('./call-types')

const METHOD_PROPS = ['name', 'options', 'type', 'requestStream', 'responseStream',
    'requestName', 'responseName', 'path', 'requestType', 'responseType', 'originalName']


function getCallTypeFromCall(call) {
    const name = Object.getPrototypeOf(call).constructor.name

    if (name.indexOf('ServerUnaryCall') == 0) {
        return CallType.UNARY
    } else if (name.indexOf('ServerWritableStream') === 0) {
        return CallType.RESPONSE_STREAM
    } else if (name.indexOf('ServerReadableStream') === 0) {
        return CallType.REQUEST_STREAM
    } else if (name.indexOf('ServerDuplexStream') === 0) {
        return CallType.DUPLEX
    }
}

function getCallTypeFromDescriptor(descriptor) {
    if (!descriptor.requestStream && !descriptor.responseStream) {
        return CallType.UNARY
    } else if (!descriptor.requestStream && descriptor.responseStream) {
        return CallType.RESPONSE_STREAM
    } else if (descriptor.requestStream && !descriptor.responseStream) {
        return CallType.REQUEST_STREAM
    } else {
        return CallType.DUPLEX
    }
}

function getDesiredMethodProps(method) {
    return METHOD_PROPS.reduce((accumulator, currentKey) => {
        accumulator[currentKey] = method[currentKey];
        return accumulator
    }, {})
}

function getServiceDefinitions(proto) {
    const services = {}
    const visited = new Set()
    const queue = [proto]

    while (queue.length > 0) {
        const current = queue.pop()

        if (visited.has(current)) {
            continue
        }

        for (const entry of Object.values(current)) {
            if (!entry) {
                continue
            }

            if (typeof entry !== 'object' && typeof entry !== 'function') {
                continue
            }

            if (entry.type && typeof entry.type !== 'object') {
                continue
            }

            if (Buffer.isBuffer(entry)) {
                continue
            }

            queue.push(entry)


            if (isService(entry)) {
                const service = entry.service || entry
                const methodNames = Object.keys(service)
                const fullServiceName = getServiceNameFromPath(service[methodNames[0]].path)

                if (services[fullServiceName]) {
                    continue
                }

                const shortServiceName = getShortServiceNameFromPath(service[methodNames[0]].path)

                const methods = Object
                    .values(service)
                    .reduce((methods, method) => {
                        methods[method.path] = {
                            ...getDesiredMethodProps(method),
                            name: getDesiredMethodNameFromPath(method.path),
                            fullName: method.path,
                            package: getPackageNameFromPath(method.path),
                            service: shortServiceName
                        }
                        return methods
                    }, {})

                services[fullServiceName] = {
                    shortServiceName,
                    fullServiceName,
                    service,
                    methods
                }
            }
        }

        visited.add(current)
    }

    return services
}

function getServiceNameFromPath(path) {
    const parts = path.split('/')
    return parts[1]
}

function getMethodNameFromPath(path) {
    const parts = path.split('/')
    return path[parts.length - 1]
}

function getPackageNameFromPath(path) {
    const sName = getServiceNameFromPath(path)

    if (sName.indexOf('.') === -1) {
        return ''
    }

    const parts = sName.split('.')
    parts.pop()
    return parts.join('.')
}

function getShortServiceNameFromPath(path) {
    const sName = getServiceNameFromPath(path)
    if (sName.indexOf('.') === -1) {
        return sName
    }

    const parts = sName.split('.')
    return parts.pop()
}

function isService(v) {
    v = v.service || v
    const vKeys = Object.keys(v)

    return vKeys.length > 0 && v[vKeys[0]] && v[vKeys[0]].path &&
        typeof v[vKeys[0]].path === 'string' && v[vKeys[0]].path[0] === '/'
}

module.exports = {
    getCallTypeFromCall,
    getCallTypeFromDescriptor,
    getServiceDefinitions,
    getServiceNameFromPath,
    getMethodNameFromPath,
    getPackageNameFromPath,
    getShortServiceNameFromPath
}