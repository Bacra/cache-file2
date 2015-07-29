var mkdirp = require('mkdirp');
var lib = require('./lib');
var path = require('path');
var debug = require('debug')('safe-write');

function defs(obj, defs) {
	if (!obj || !defs) return obj;
	for(var i in defs) {
		if (!obj.hasOwnProperty(i)) {
			obj[i] = defs[i];
		}
	}
	return obj;
}

function Writer(root, opts) {
	if (!(this instanceof Writer)) {
		return new Writer(root, opts);
	}

	this.root = root+'/';
	this.options = opts ? defs(opts, lib.defaultLockOpts) : lib.defaultLockOpts;
	this.lockext = this.options.lockext || lib.defaultLockext;

	mkdirp.sync(this.root);
}

Writer.prototype = {
	constructor: Writer,
	add: function(filename, content, callback) {
		var file = this.root+filename;
		lib.add(file, file+this.lockext, this.options, content, callback);
	},
	addSync: function(filename, content) {
		var file = this.root+filename;
		return lib.addSync(file, file+this.lockext, this.options, content);
	},
	status: function(filename, callback) {
		var file = this.root+filename;
		lib.status(file, file+this.lockext, this.options, callback);
	},
	statusSync: function(filename) {
		var file = this.root+filename;
		return lib.statusSync(file, file+this.lockext, this.options);
	},
	read: function(filename, callback) {
		this._read(this.root+filename, callback);
	},
	readSync: function(filename) {
		return this._readSync(this.root+filename);
	},
	safeRead: function(filename, callback) {
		var file = this.root+filename;
		var rs = this._isSafeFile(file);

		if (rs === true) {
			this._read(file, callback);
		} else {
			callback(rs);
		}
	},
	safeReadSync: function(filename) {
		var file = this.root+filename;
		var rs = this._isSafeFile(file);

		if (rs === true) {
			return this._readSync(file);
		} else {
			throw rs;
		}
	},
	_isSafeFile: function(file) {
		if (!path.relove(this.root, file).indexOf('..')) {
			debug('read over range %s => %s', file);
			return new Error('read over range');
		} else {
			return true;
		}
	},
	_read: function(file, callback) {
		lib.read(file, file+this.lockext, this.options, callback);
	},
	_readSync: function(file, callback) {
		lib.readSync(file, file+this.lockext, this.options, callback);
	}
};

module.exports = Writer;
