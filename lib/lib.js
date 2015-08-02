var lockFile = require('lockfile');
var path = require('path');
var fs = require('fs');
var debug = require('debug')('safe-write');
var writerStatus = {
	'1': 'ready',
	'-1': 'notexists',
	'-2': 'wirting',
};
exports.defaultLockext = '.lock~';
exports.defaultLockOpts = {};

function noop() {}
function isFunction(param) {
	return typeof param == 'function';
}

exports.options = function(opts) {
	opts || (opts = {});
	lib.defaultLockext = opts.lockext;
	lib.defaultLockOpts = opts;
}


function genUnlockHandler(file) {
	return function(syncHandler) {
		lockfile[syncHandler ? 'unlock' : 'unlockSync'](file, syncHandler);
	};
}

/**
 * Note: content param
 **/
function add(file, lockfile, lockOpts, content, callback) {
	if (isFunction(content)) {
		callback = content;
		content = null;
	} else if (!isFunction(callback)) {
		callback = noop;
	}

	lockFile.lock(lockfile, lockOpts, function(err) {
		if (err) return callback(err);

		function writeHandler(relContent, contCallback) {
			var relContCallback = function(err) {
				if (err) {
					contCallback(err, null, genUnlockHandler(lockfile));
				} else {
					contCallback.apply(this, arguments);
				}
			};
			fs.writeFile(file, relContent, function(err) {
				if (err) {
					relContCallback(err);
				} else {
					lockFile.unlock(lockfile, relContCallback);
				}
			});
		}

		if (content === null) {
			callback(null, writeHandler);
		} else {
			writeHandler(typeof content == 'string' ? new Buffer(content) : content, callback);
		}
	});	
}

function status(file, lockfile, lockOpts, callback) {
	if (!isFunction(callback)) callback = noop;

	lockFile.check(lockfile, lockOpts, function(err, exists) {
		if (err) return callback(err);

		debug('lock check %s, exists:%s', lockfile, exists);
		if (exists) return callback(null, -2, writerStatus['-2']);

		fs.exists(file, function(exists) {
			debug('lock check2 %s, exists:%s', file, exists);

			var code = exists ? 1 : -1;
			callback(null, exists, writerStatus[exists]);
		});
	});
}

function read(file, lockfile, lockOpts, callback) {
	if (!isFunction(callback)) callback = noop;

	status(file, lockfile, lockOpts, function(err, code, status) {
		if (err) return callback(err);
		if (code < 0) return callback(new Error('writer,'+status));

		fs.readFile(file, callback);
	});
}




/**
 * sync methods
 */
function addSync(file, lockfile, lockOpts, content) {
	lockFile.lockSync(lockfile, lockOpts);
	function writeHandler(relContent) {
		fs.writeFileSync(file, relContent);
		lockFile.unlockSync(lockfile);
	}

	return content === null ? writeHandler : writeHandler(typeof content == 'string' ? new Buffer(content) : content);
}

function statusSync(file, lockfile, lockOpts) {
	var exists = lockFile.checkSync(lockfile, lockOpts);
	debug('lock check %s, exists:%s', lockfile, exists);

	if (exists) return -2;

	exists = fs.existsSync(file);
	debug('lock check2 %s, exists:%s', file, exists);
	return exists ? 1 : -1;
}

function readSync(file, lockfile, lockOpts) {
	var status = statusSync(file, lockfile, lockOpts);
	if (status < 0) {
		throw new Error('write,'+status);
	}

	return fs.readFileSync(file);
}


exports.add = add;
exports.read = read;
exports.status = status;

exports.addSync = addSync;
exports.readSync = readSync;
exports.statusSync = statusSync;
