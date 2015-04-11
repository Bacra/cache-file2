var lib = require('./lib/lib');

exports = module.exports = require('./lib/methods');
exports.Cache = require('./lib/class');
exports.options = lib.options;

// ext lib methods
['add', 'read', 'status'].forEach(function(name) {
	exports['l'+name] = lib[name];
});
