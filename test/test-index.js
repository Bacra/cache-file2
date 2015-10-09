var debug		= require('debug');
debug.enable('safe-write:test');
// debug.enable('*');

var testlog		= debug('safe-write:test');
var cluster		= require('cluster');
var testPath	= __dirname+'/tmp';
var testFileNum	= 3;
var clientNum	= 5;
var writeTimes	= 100;

process.env.UV_THREADPOOL_SIZE = 64;


if (cluster.isMaster)
{
	var fs		= require('fs');
	var assert	= require('assert');

	fs.existsSync(testPath) ? require('rmdir')(testPath, done) : done();

	function done()
	{
		var startProNum		= clientNum;
		var waitExitNum		= clientNum;
		var waitOnlineNum	= clientNum;
		var workers = [];

		while(startProNum--)
		{
			var f = cluster.fork();
			f.once('online', function()
				{
					if (!--waitOnlineNum)
					{
						require('mkdirp').sync(testPath);
						eachFile(function(file, fileIndex)
						{
							fs.closeSync(fs.openSync(file, 'a'));
						});

						workers.forEach(function(f)
						{
							f.send('start');
						});
					}
				})
				.once('exit', function()
				{
					if (!--waitExitNum)
					{
						var expectLineNum = (writeTimes)*clientNum+1;
						eachFile(function(file, fileIndex)
						{
							assert.ok(fs.existsSync(file), 'content '+fileIndex+' err');
							var fileLine = fs.readFileSync(file).toString().split('\n').length;
							testlog('fileline %d:%d/%d', fileIndex, fileLine, expectLineNum);
							assert.ok(fileLine <= expectLineNum, 'write '+fileIndex+' line:'+fileLine+'/'+expectLineNum);
						});
						// process.exit();
					}
				});

			workers.push(f);
		}
	}
}
else
{
	process.on('message', function(msg)
	{
		if (msg != 'start') return;

		var safeWrite = require('../');
		var waitFiles = testFileNum;
		testlog('start write query, pid:%d', process.pid);

		eachFile(function(file, fileIndex)
		{
			process.nextTick(function()
			{
				var baseContent = 'file'+fileIndex+','+process.pid+',';
				var pro = Promise.resolve();

				for(var i = writeTimes; i--;)
				{
					pro = pro.then(function()
							{
								return safeWrite.read(file);
							})
							.then(function(content)
							{
								var newContent = baseContent+Date.now();

								if (content) {
									// testlog('<%d,%d> read rs:%d', process.pid, fileIndex, content.toString().split('\n').length);
									newContent = content +'\n'+newContent;
								}

								return safeWrite.write(file, newContent)
										.catch(function(err)
										{
											err && testlog('write err, %o', err);
										});
							},
							function(err)
							{
								testlog('<%d,%d> read err:%o', process.pid, fileIndex, err);
							});
				}

				pro.then(function()
				{
					if (!--waitFiles) process.exit();
				});
			});
		});
	});
}


function eachFile(handler)
{
	for(var i = testFileNum; i--;)
	{
		(handler)(testPath+'/tmp'+i, i);
	}
}
