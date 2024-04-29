const CallType = require('lib/call-types');

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

        }
    }
}