const fs = require('fs').promises;
const debug = require('debug')('safe-write');
const mkdirp = require('mkdirp');
const path = require('path');

/**
 * 向文件写入内容
 * @param  {String}        file
 * @param  {String/Buffer} newContent
 * @return {Promise}
 */
module.exports = async function fastWrite(file, newContent) {
	const filepath = path.dirname(file);
	const tmpFile = `${filepath}/.${path.basename(file)}.${Date.now()}.${process.pid}.${Math.random() * 10000}~`;

	debug('write file:%s tmpFile:%s', file, tmpFile);

	await mkdirp(filepath);
	await fs.writeFile(tmpFile, newContent);

	return fs.rename(tmpFile, file);
}
