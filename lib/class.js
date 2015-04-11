var mkdirp = require('mkdirp');
var lib = require('./lib');
var path = require('path');
var debug = require('debug')('cache-file2');

function defs(obj, defs) {
	if (!obj || !defs) return obj;
	for(var i in defs) {
		if (!obj.hasOwnProperty(i)) {
			obj[i] = defs[i];
		}
	}
	return obj;
}

function Cache(root, opts) {
	if (!(this instanceof Cache)) {
		return new Cache(root, opts);
	}

	this.root = root+'/';
	this.options = opts ? defs(opts, lib.defaultLockOpts) : lib.defaultLockOpts;
	this.lockext = this.options.lockext || lib.defaultLockext;

	mkdirp.sync(this.root);
}

Cache.prototype = {
	constructor: Cache,
	add: function(filename, content, callback) {
		var file = this.root+filename;
		lib.add(file, file+this.lockext, this.options, content, callback);
	},
	status: function(filename, callback) {
		var file = this.root+filename;
		lib.status(file, file+this.lockext, this.options, callback);
	},
	read: function(filename, callback) {
		this._read(this.root+filename, callback);
	},
	safeRead: function(filename, callback) {
		var file = this.root+filename;

		if (!path.relove(this.root, file).indexOf('..')) {
			debug('read over range %s => %s', filename, file);
			callback(new Error('read over range'));
		} else {
			this._read(file, callback);
		}
	},
	_read: function(file, callback) {
		lib.read(file, file+this.lockext, this.options, callback);
	},
};

module.exports = Cache;
