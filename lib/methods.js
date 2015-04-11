var lib = require('./lib');
var mkdirp = require('mkdirp');
var path = require('path');

module.exports = {
	add: function(file, content, callback) {
		mkdirp(path.dirname(file));
		lib.add(file, file+lib.defaultLockext, lib.defaultLockOpts, content, callback);
	},
	status: function(file, callback) {
		lib.status(file, file+lib.defaultLockext, lib.defaultLockOpts, callback);
	},
	read: function(file, callback) {
		lib.read(file, file+lib.defaultLockext, lib.defaultLockOpts, callback);
	}
};
