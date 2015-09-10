// require('debug').enable('safe-write*');

var fs			= require('fs');
var rmdir		= require('rmdir');
var assert		= require('assert');
var cluster		= require('cluster');
var testPath	= __dirname+'/tmp';
var testFileNum	= 8;
var clientNum	= 8;


if (cluster.isMaster) {

	if (fs.existsSync(testPath)) {
		rmdir(testPath, done);
	} else {
		done();
	}


	function done() {

		var waitExitNum = clientNum;
		var waitOnlineNum = clientNum;
		var workers = [];

		while(clientNum--) {
			var f = cluster.fork();
			f.once('online', function() {
					if (!--waitOnlineNum) {
						workers.forEach(function(f) {
							f.send('start');
						});
					}
				})
				.once('exit', function() {
					if (!--waitOnlineNum) {
						eachFile(function(file, fileIndex) {
							assert.ok(fs.existsSync(file), 'content'+fileIndex+' err');
						});
						// process.exit();
					}
				});
			workers.push(f);
		}
	}

} else {

	process.on('message', function(msg) {
		if (msg != 'start') return;

		var safeWrite = require('../');
		var writeTimes = 100;
		var waitTimes = testFileNum;
		console.log('start write query, pid:'+process.pid);

		eachFile(function(file, fileIndex) {
			process.nextTick(function() {
				var baseContent = 'content'+fileIndex+','+process.pid+',';
				var pro = safeWrite.write(file, baseContent+Date.now());

				for(var i = writeTimes; i--;) {
					pro = pro.then(function() {
						return safeWrite.read(file, function(err, content) {
								// console.log(err, content);
								var newContent = baseContent+Date.now();

								if (err) {
									console.log('read err', err.stack);
								} else {
									newContent = content +'\n'+newContent;
								}

								return safeWrite.write(file, newContent)
									.then(function(err) {
										err && console.log('write err', err.stack);
									});
							});
					});
				}

				pro.then(function() {
					if (!--waitTimes) process.exit();
				});
			});
		});
	});

}


function eachFile(handler) {
	for(var i = testFileNum; i--;) {
		(handler)(testPath+'/tmp'+i, i);
	}
}
