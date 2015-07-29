var lib = require('./lib/lib');

exports = module.exports = require('./lib/methods');
exports.Writer = require('./lib/class');
exports.options = lib.options;

// ext lib methods
['add', 'read', 'status', 'addSync', 'readSync', 'statusSync'].forEach(function(name) {
	exports['l'+name] = lib[name];
});
