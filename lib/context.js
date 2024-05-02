const delegate = require('delegates')

class Context { }

delegate(Context.prototype, 'request')
    .access('req')
    .access('type')
    .getter('call')
    .getter('metadata')
    .method('get')

delegate(Context.prototype, 'response')
    .access('res')
    .method('sendMetadata')
    .method('set')
    .method('getStatus')
    .method('setStatus')

module.exports = Context