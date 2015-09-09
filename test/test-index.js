// require('debug').enable('safe-write*');

var fs			= require('fs');
var rmdir		= require('rmdir');
var assert		= require('assert');
var cluster		= require('cluster');
var testPath	= __dirname+'/tmp';

if (cluster.isMaster) {

	if (fs.existsSync(testPath)) {
		rmdir(testPath, done);
	} else {
		done();
	}


	function done() {

		var clientNum = 8;
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
						assert.ok(fs.existsSync(testPath+'/tmp1.conf'), 'add content1 err');
						assert.ok(fs.existsSync(testPath+'/tmp2.conf'), 'add content2 err');
						assert.ok(fs.existsSync(testPath+'/tmp3.conf'), 'add content3 err');
						// process.exit();
					}
				});
			workers.push(f);
		}
	}

} else {

	process.on('message', function(msg) {
		if (msg != 'start') return;

		var safeRewrite = require('../');
		var writeTimes = 4;
		var writeQuery = [];

		function rewrite() {
			writeQuery.push(arguments);
		}
		while(writeTimes--) {
			rewrite(testPath+'/tmp1.conf', 'content1,'+process.pid);
			rewrite(testPath+'/tmp2.conf', 'content2,'+process.pid+Date.now());
			rewrite(testPath+'/tmp3.conf', 'content3,'+process.pid+Date.now());
		}

		process.nextTick(function() {
			var waitTimes = writeQuery.length;
			console.log('start write query, pid:'+process.pid);

			writeQuery.forEach(function(args) {
				safeRewrite.write.apply(safeRewrite, args)
					.then(function() {
						if (!--waitTimes) process.exit();
					});
			});
		});
	});

}

