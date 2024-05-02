const grpc = require('@grpc/grpc-js')
const CallType = require('./call-types')
const Metadata = require('./metadata')

class Request {
    constructor(call, type) {
        this.call = call
        this.type = type

        if (call.metadata instanceof grpc.Metadata) {
            this.metadata = call.metadata.getMap()
        } else {
            this.metadata = call.metadata
        }

        if (type === CallType.RESPONSE_STREAM || type === CallType.UNARY) {
            this.req = call.request
        } else {
            this.req = call
        }
    }

    getMetadata() {
        return Metadata.create(this.metadata)
    }

    get(field) {
        let val
        if (this.metadata) {
            val = this.metadata[field]
        }
        return val
    }
}

module.exports = Request