var fs		= require('fs');
var debug	= require('debug')('safe_rewrite');
var lockmgr	= require('lockfile');
var mkdirp	= require('mkdirp');
var path	= require('path');

if (typeof Promise == 'undefined') Promise = require('promise');

exports.read = read;
exports.write = write;
exports.lockOpts = {stale: 1000, retries: 3, retryWait: 100};
exports.readLockWait = 3*1000;

/**
 * 读取文件内容
 * @param  {String}   file
 * @param  {Function} callback
 * @return {Promise}             Promise then返回参数为 [err, content]
 */
function read(file, callback) {
	var lockFile = _getLockFile(file);
	
	var pro = new Promise(function(resolve, reject) {
			lockmgr.check(lockFile, exports.lockOpts, _resolveWidthError(resolve, reject));
		})
		.then(function(lock) {
			// 被lock的情况下，进行文件监听
			return lock && new Promise(function(resolve) {
					fs.exists(lockFile, resolve);
				})
				.then(function(exists) {
					return exists && new Promise(function(resolve, reject) {
						debug('watch file:%s', file);
						var fsw, wait;

						// 监听超时后，使用lockmgr检查一下是不是已经过期了
						wait = setTimeout(function() {
							fsw && fsw.close();
							lockmgr.check(lockFile, exports.lockOpts, _resolveWidthError(resolve, reject));
						}, exports.readLockWait);

						try {
							// 使用FSWatch 监听文件的删除
							fsw = fs.watch(lockFile)
								.on('change', function(event) {
									if (event == 'rename') {
										debug('file fire rename event');

										wait && clearTimeout(wait);
										this.close();
										resolve();
									}
								})
								.on('error', function(err) {
									wait && clearTimeout(wait);
									reject(err);
								});
						} catch(err) {
							// 在开始监听的时候，文件被删除
							wait && clearTimeout(wait);

							if (fs.existsSync(lockFile)) {
								reject(err);
							} else {
								resolve();
							}
						}
					});
				});
		})
		.then(function() {
			return new Promise(function(resolve, reject) {
				fs.readFile(file, function(err, content) {
					if (err) {
						reject(err);
					} else {
						resolve(null, content);
					}
				});
			});
		})
		.catch(function(err) {
			debug('read file err:%o', err);
			return err;
		});

	// 兼容callback
	if (typeof callback == 'function') pro.then(callback);

	return pro;
}


/**
 * 向文件写入内容
 * @param  {String}          file
 * @param  {String/Buffer}   newContent
 * @param  {String/Buffer}   oldContent
 * @param  {Function}        callback
 * @return {Promise}
 */
function write(file, newContent, oldContent, callback) {
	var filepath	= path.dirname(file);
	var lockFile	= _getLockFile(file);
	var tmpFile		= _extfilename(file, ['', Date.now(), process.pid, Math.floor(Math.random()*10000), ''].join('~'));

	debug('rewrite lockFile:%s tmpFile:%s', lockFile, tmpFile);

	var pro = new Promise(function(resolve) {
			fs.exists(filepath, resolve);
		})
		.then(function(exists) {
			return exists || new Promise(function(resolve, reject) {
					mkdirp(filepath, _resolveWidthError(resolve, reject));
				});
		})
		// .catch(function(err) {
		// 	debug('mkdirp err:%o', err);
		// })
		.then(function() {
			// lock 工作区域
			debug('lock workspace');

			return new Promise(function(resolve, reject) {
				lockmgr.lock(lockFile, exports.lockOpts, _resolveWidthError(resolve, reject));
			});
		})
		.then(function() {
			// 读取旧文件内容
			debug('get old content');

			return oldContent || new Promise(function(resolve) {
					fs.exists(file, resolve);
				})
				.then(function(exists) {
					return !exists ? undefined : new Promise(function(resolve, reject) {
							fs.readFile(file, _resolveWidthError(resolve, reject));
						});
				})
				.catch(function(err) {
					debug('read oldContent err:%o', err);
				});
		})
		.then(function(oldContent) {
			// 如果有旧内容，先判断一下是否需要重写
			if (!!oldContent && !!newContent
				&& newContent.toString() == oldContent.toString()) {
				return debug('rewrite block: content equal');
			} else {
				// 写入新内容
				debug('write new content');

				return new Promise(function(resolve, reject) {
						fs.writeFile(tmpFile, newContent, _resolveWidthError(resolve, reject));
					})
					.then(function() {
						return new Promise(function(resolve, reject) {
							try {
								// rename 快速把内容转移过去
								fs.renameSync(tmpFile, file);
							} catch(err) {
								return reject(err);
							}

							resolve();
						});
					})
					.then(function() {
						// 检查写入的文件是否正确
						return new Promise(function(resolve, reject) {
							fs.readFile(file, function(err, content) {
								if (err) return reject(err);
								if (content.toString() != newContent.toString()) {
									return reject(new Error('file content write fail'));
								}

								resolve();
							});
						});
					})
					.catch(function(err) {
						debug('rewrite err:%o', err);
					});
			}
		})
		.then(function() {
			debug('unlock workspace');
			// unlock 工作区
			return new Promise(function(resolve, reject) {
				lockmgr.unlock(lockFile, _resolveWidthError(resolve, reject, true));
			});
		})
		.catch(function(err) {
			debug('rewrite wrap task err: %o', err);
			return err;
		});


	// 支持一下callback，其实不用callback会更好
	if (typeof callback == 'function') {
		pro.then(function(err) {
			callback(err);
			return err;
		});
	}

	return pro;
}


function _resolveWidthError(resolve, reject, ignoreData) {
	return function(err, data) {
		if (err) {
			reject(err);
		} else {
			resolve(ignoreData ? undefined : data);
		}
	}
}

function _getLockFile(file) {
	return _extfilename(file, '~lock~');
}

function _extfilename(file, ext) {
	return path.dirname(file)+'/.'+ext+path.basename(file);
}
