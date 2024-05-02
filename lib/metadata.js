const grpc = require('@grpc/grpc-js')

function create(metadata) {
    if (typeof metadata !== 'object') {
        return
    }

    if (metadata instanceof grpc.Metadata) {
        return metadata
    }

    const meta = new grpc.Metadata()

    for (const k in metadata) {
        const v = metadata[k]
        if (Buffer.isBuffer(v)) {
            meta.set(k, v)
        } else if (v !== null && typeof v !== 'undefined') {
            const toAdd = typeof v === 'string' ? v : v.toString()
            if (toAdd) {
                meta.set(k, toAdd)
            }
        }
    }

    return meta
}