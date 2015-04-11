var lockFile = require('lockfile');
var path = require('path');
var fs = require('fs');
var debug = require('debug')('cache-file2');
var cacheStatus = {
	'1': 'cache',
	'-1': 'nocache',
	'-2': 'wirting',
};
exports.defaultLockext = '.lock~';
exports.defaultLockOpts = {};

exports.options = function(opts) {
	opts || (opts = {});
	lib.defaultLockext = opts.lockext;
	lib.defaultLockOpts = opts;
}

/**
 * Note: content param
 **/
function addCache(file, lockfile, lockOpts, content, callback) {
	if (typeof content == 'function') {
		callback = content;
		content = null;
	}

	lockFile.lock(lockfile, lockOpts, function(err) {
		if (err) return callback(err);

		function cacheContent(relContent, contCallback) {
			fs.writeFile(file, relContent === null ? content : relContent, function(err) {
				if (err) return contCallback(err);

				lockFile.unlock(lockfile, contCallback);
			});
		}

		if (content === null) {
			callback(null, cacheContent);
		} else {
			cacheContent(callback, null);
		}
	});	
}

function statusCache(file, lockfile, lockOpts, callback) {
	lockFile.check(lockfile, lockOpts, function(err, exists) {
		if (err) return callback(err);

		debug('lock check %s, exists:%s', lockfile, exists);
		if (exists) return callback(null, -2, cacheStatus['-2']);

		fs.exists(file, function(exists) {
			debug('lock check2 %s, exists:%s', file, exists);

			var code = exists ? 1 : -1;
			callback(null, exists, cacheStatus[exists]);
		});
	});
}

function readCache(file, lockfile, lockOpts, callback) {
	statusCache(file, lockfile, lockOpts, function(err, code, status) {
		if (err) return callback(err);
		if (code < 0) return callback(new Error('cache,'+status));

		fs.readFile(file, callback);
	});
}

exports.add = addCache;
exports.read = readCache;
exports.status = statusCache;
