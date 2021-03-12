const fs = require('fs')
const fsAsync = fs.promises;
const debug = require('debug')('safe-write');
const mkdirp = require('mkdirp');
const path = require('path');

/**
 * 向文件写入内容
 * @param  {String}        file
 * @param  {String/Buffer} content
 * @return {Promise}
 */
exports = module.exports = async function async(file, content) {
	const filepath = path.dirname(file);
	const tmpFile = _tmpFile(file, filepath);

	debug('write file:%s tmpFile:%s', file, tmpFile);

	await mkdirp(filepath);
	await fsAsync.writeFile(tmpFile, content);

	return fsAsync.rename(tmpFile, file);
};

exports.sync = function sync(file, content) {
	const filepath = path.dirname(file);
	const tmpFile = _tmpFile(file, filepath);

	debug('write file:%s tmpFile:%s', file, tmpFile);

	mkdirp.sync(filepath);
	fs.writeFileSync(tmpFile, content);

	fs.renameSync(tmpFile, file);
};

function _tmpFile(file, filepath) {
	return `${filepath}/.${path.basename(file)}.${Date.now()}.${process.pid}.${Math.random() * 10000}~`;
}
