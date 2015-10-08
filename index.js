var fs		= require('fs');
var debug	= require('debug');
var lockmgr	= require('lockfile');
var mkdirp	= require('mkdirp');
var path	= require('path');
var extend	= require('extend');

var logger =
{
	read	: debug('safe-write:read'),
	write	: debug('safe-write:write')
};

if (typeof Promise == 'undefined') Promise = require('promise');

exports.read = read;
exports.write = write;
exports.lockOpts = {stale: 10000, retries: 6, retryWait: 50};

/**
 * 读取文件内容
 * @param  {String}    file
 * @param  {Function}  callback
 * @param  {Boolean}   ignoreUnlockErr
 * @return {Promise}   Promise then返回参数为 [err, content]
 */
function read(file, callback, ignoreUnlockErr)
{
	var lockFile = _getLockFile(file);

	// 处理参数
	if (typeof callback == 'boolean')
	{
		ignoreUnlockErr = callback;
		callback = null;
	}
	ignoreUnlockErr = ignoreUnlockErr !== false;

	logger.read('read lockFile:%s igunlock:%s', lockFile, ignoreUnlockErr);

	var pro = new Promise(function(resolve, reject)
		{
			lockmgr.lock(lockFile, extend({}, exports.lockOpts), _resolveWidthError(resolve, reject));
		})
		.then(function()
		{
			return new Promise(function(resolve, reject)
				{
					fs.readFile(file, function(err, content)
						{
							err ? reject(err) : resolve(content);
						});
				});
		})
		.then(function(content)
		{
			return new Promise(function(resolve, reject)
				{
					lockmgr.unlock(lockFile, function(err)
						{
							if (err)
							{
								logger.read('unlock err:%o', err);
								if (ignoreUnlockErr) return reject(err);
							}

							resolve(content);
						});
				});
		},
		function(redErr)
		{
			return new Promise(function(resolve, reject)
				{
					lockmgr.unlock(lockFile, function(err)
						{
							if (err) logger.read('unlock err:%o', err);
							reject(redErr);
						});
				});
		})
		.then(function(content)
		{
			logger.read('read suc,len:%d', content.length);
			return content;
		},
		function(err)
		{
			logger.read('read file err:%o', err);
			throw err;
		});

	_supportCallback(callback, pro);

	return pro;
}


/**
 * 向文件写入内容
 * @param  {String}         file
 * @param  {String/Buffer}  newContent
 * @param  {String/Buffer}  oldContent
 * @param  {Function}       callback
 * @param  {Boolean}        ignoreUnlockErr
 * @return {Promise}
 */
function write(file, newContent, oldContent, callback, ignoreUnlockErr)
{
	var filepath	= path.dirname(file);
	var lockFile	= _getLockFile(file);
	var tmpFile		= _extfilename(file, ['', Date.now(), process.pid, Math.floor(Math.random()*10000), ''].join('~'));

	// 处理参数
	if (typeof callback == 'boolean')
	{
		ignoreUnlockErr = callback;
		callback = null;
	}
	ignoreUnlockErr = ignoreUnlockErr !== false;

	logger.write('write lockFile:%s tmpFile:%s igunlock:%s', lockFile, tmpFile, ignoreUnlockErr);

	var pro = new Promise(function(resolve)
		{
			fs.exists(filepath, resolve);
		})
		.then(function(exists)
		{
			return exists || new Promise(function(resolve, reject)
				{
					mkdirp(filepath, _resolveWidthError(resolve, reject));
				});
		})
		.then(function()
		{
			// lock 工作区域
			logger.write('lock workspace');

			return new Promise(function(resolve, reject)
				{
					lockmgr.lock(lockFile, extend({}, exports.lockOpts), _resolveWidthError(resolve, reject));
				});
		})
		.then(function()
		{
			// 读取旧文件内容
			logger.write('get old content');

			return oldContent || new Promise(function(resolve)
				{
					fs.exists(file, resolve);
				})
				.then(function(exists)
				{
					return !exists ? undefined : 
						new Promise(function(resolve, reject)
						{
							fs.readFile(file, _resolveWidthError(resolve, reject));
						});
				})
				.catch(function(err)
				{
					logger.write('read oldContent err:%o', err);
				});
		})
		.then(function(oldContent)
		{
			// 如果有旧内容，先判断一下是否需要重写
			if (!!oldContent && !!newContent
				&& newContent.toString() == oldContent.toString())
			{
				logger.write('write block: content equal');
				return;
			}
			else
			{
				// 写入新内容
				logger.write('write new content');

				return new Promise(function(resolve, reject)
					{
						fs.writeFile(tmpFile, newContent, _resolveWidthError(resolve, reject));
					})
					.then(function()
					{
						return new Promise(function(resolve, reject)
							{
								try {
									// rename 快速把内容转移过去
									fs.renameSync(tmpFile, file);
								}
								catch(err) {
									return reject(err);
								}

								resolve();
							});
					})
					.then(function()
					{
						// 检查写入的文件是否正确
						return new Promise(function(resolve, reject)
							{
								fs.readFile(file, function(err, content)
								{
									if (err) return reject(err);

									if (content.toString() != newContent.toString())
										return reject(new Error('file content write fail'));

									resolve();
								});
							});
					})
					.catch(function(err)
					{
						logger.write('write err:%o', err);
					});
			}
		})
		.then(function()
		{
			logger.write('unlock workspace');
			// unlock 工作区
			// 不管有没有unlock成功
			return new Promise(function(resolve)
				{
					lockmgr.unlock(lockFile, function(err)
						{
							if (err)
							{
								logger.write('unlock err:%o', err);
								if (ignoreUnlockErr) return reject(err);
							}

							resolve();
						});
				});
		},
		function(wrErr)
		{
			return new Promise(function(resolve, reject)
				{
					lockmgr.unlock(lockFile, function(err)
						{
							if (err) logger.write('unlock err:%o', err);
							reject(wrErr);
						});
				});
		})
		.catch(function(err)
		{
			logger.write('write file err:%o', err);
			throw err;
		});


	_supportCallback(callback, pro);

	return pro;
}


function _resolveWidthError(resolve, reject)
{
	return function(err, data)
	{
		err ? reject(err) : resolve(data);
	}
}

function _getLockFile(file)
{
	return _extfilename(file, '~lock~');
}

function _extfilename(file, ext)
{
	return path.dirname(file)+'/.'+ext+path.basename(file);
}

// 支持一下callback，其实不用callback会更好
function _supportCallback(callback, pro)
{
	if (typeof callback == 'function')
	{
		pro.then(function(data)
		{
			callback(null, data);
		},
		callback);
	}
}
