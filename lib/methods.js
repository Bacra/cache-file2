var lib = require('./lib');
var mkdirp = require('mkdirp');
var path = require('path');

module.exports = {
	add: function(file, content, callback) {
		mkdirp(path.dirname(file), function(err) {
			if (err) return callback(err);

			lib.add(file, file+lib.defaultLockext, lib.defaultLockOpts, content, callback);
		});
	},
	addSync: function(file, content) {
		mkdirp.sync(path.dirname(file));
		return lib.addSync(file, file+lib.defaultLockext, lib.defaultLockOpts, content);
	},
	status: function(file, callback) {
		lib.status(file, file+lib.defaultLockext, lib.defaultLockOpts, callback);
	},
	statusSync: function(file) {
		return lib.statusSync(file, file+lib.defaultLockext, lib.defaultLockOpts);
	},
	read: function(file, callback) {
		lib.read(file, file+lib.defaultLockext, lib.defaultLockOpts, callback);
	},
	readSync: function(file) {
		return lib.readSync(file, file+lib.defaultLockext, lib.defaultLockOpts);
	},
};
