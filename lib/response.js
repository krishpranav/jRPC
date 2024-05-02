const grpc = require('@grpc/grpc-js')
const CallType = require('./call-types')
const Metadata = require('./metadata')

class Response {
    constructor(call, type) {
        this.call = call
        this.type = type

        if (type == CallType.DUPLEX) {
            this.res = call
        }
    }

    set(field, val) {
        if (arguments.length === 2) {
            if (!this.metadata) {
                this.metadata = {}
            }
            this.metadata[field] = val
        } else {
            const md = field instanceof grpc.Metadata ? field.getMap() : field

            if (typeof md === 'object') {
                for (const key in md) {
                    this.set[key, md[key]]
                }
            }
        }
    }

    get(field) {
        let val
        if (this.metadata) {
            val = this.metadata[field]
        }
        return val
    }

    getMetadata() {
        return Metadata.create(this.metadata)
    }

    sendMetadata(md) {
        if (md && (typeof md === 'object' || md instanceof grpc.Metadata)) {
            this.metadata = null
            this.set(md)
        }

        const data = this.getMetadata()
        if (data) {
            this.call.sendMetadata(data)
        }
    }

    getStatus(field) {
        let val

        if (this.status) {
            val = this.status[field]
        }

        return val
    }

    setStatus(field, val) {
        if (arguments.length === 2) {
            if (!this.status) {
                this.status = {}
            }
            this.status[field] = val
        } else {
            const md = field instanceof grpc.Metadata ? field.getMap() : field

            if (typeof md === 'object') {
                for (const key in md) {
                    this.setStatus(key, md[key])
                }
            }
        }
    }

    getStatusMetadata() {
        return Metadata.create(this.status, { addEmpty: false })
    }
}

module.exports = Response