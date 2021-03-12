const debug = require('debug')('safe-write:test');
require('debug').enable('safe-write:test');

const fs = require('fs');
const cluster = require('cluster');
const testPath = __dirname + '/tmp';
const testFileNum = 3;
const clientNum = 5;
const writeTimes = 100;

process.env.UV_THREADPOOL_SIZE = 64;

if (cluster.isMaster) {
	const assert = require('assert');

	fs.existsSync(testPath) ? require('rmdir')(testPath, done) : done();

	function done() {
		let startProNum = clientNum;
		let waitExitNum = clientNum;
		let waitOnlineNum = clientNum;
		const workers = [];

		while (startProNum--) {
			const f = cluster.fork();
			f.once('online', () => {
				if (!--waitOnlineNum) {
					require('mkdirp').sync(testPath);
					mapFile(file => fs.closeSync(fs.openSync(file, 'a')));

					workers.forEach(f => f.send('start'));
				}
			})
				.once('exit', () => {
					if (!--waitExitNum) {
						const expectLineNum = writeTimes * clientNum;
						mapFile((file, fileIndex) => {
							assert.ok(fs.existsSync(file), 'content ' + fileIndex + ' err');
							const fileLine = fs.readFileSync(file).toString().split('\n').length;
							debug('file%d: %d/%d', fileIndex, fileLine, expectLineNum);
							assert.ok(fileLine <= expectLineNum, 'write ' + fileIndex + ' line:' + fileLine + '/' + expectLineNum);
						});

						process.exit();
					}
				});

			workers.push(f);
		}
	}

} else {

	process.on('message', async (msg) => {
		if (msg != 'start') return;

		const safeWrite = require('../');
		debug('start write query, pid:%d', process.pid);

		const promises = mapFile(async (file, fileIndex) => {
			const baseContent = 'file' + fileIndex + ',' + process.pid + ',';

			for (let i = writeTimes; i--;) {
				const newContent = baseContent + Date.now();
				await safeWrite(file, fs.readFileSync(file) + '\n' + newContent);
			}
		});

		await Promise.all(promises);
		process.exit();
	});
}


function mapFile(handler) {
	const result = [];

	for (let i = testFileNum; i--;) {
		const item = handler(testPath + '/tmp' + i, i);
		result.push(item);
	}

	return result;
}
