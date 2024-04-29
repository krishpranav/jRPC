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