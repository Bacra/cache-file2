// require('debug').enable('safe-write*');

var assert = require('assert');
var safeWrite = require('../.');
var fs = require('fs');
var rmdir = require('rmdir');
var testPath = __dirname+'/tmp';


describe('[Async Base]', function() {
	before(function(done) {
		if (!fs.existsSync(testPath)) return done();
		rmdir(testPath, done);
	});

	var testfile = 'file1.json';

	function testAsync(name, filename, exthandler) {
		if (!filename) filename = name+'.json';
		if (!exthandler) exthandler = function(){};
		var file = testPath+'/'+filename;

		it(name, function(done) {
			var writer = safeWrite.Writer(testPath);
			assert.ok(!fs.existsSync(file));

			var asyncTask = 2;
			function extasync() {
				asyncTask++;
				return relDone;
			}
			function relDone() {
				if (!--asyncTask) done();
			}

			var extParams = {
				name: name,
				filename: filename,
				file: file,
				writer: writer,
				async: extasync
			};

			writer.add(filename, function(err, addContent) {
				assert.ok(!err, 'init add lock err');
				var fileContent = 'write some thing';

				exthandler('lock', extParams);

				addContent(fileContent, function(err) {
					assert.ok(!err, 'add content err');
					console.log(filename, fs.existsSync(file));
					exthandler('writeEnd', extParams);
					relDone();
				});

				writer.read(filename, function(err, content) {
					assert.ok(err);
					relDone();
				});
			});

			assert.ok(!fs.existsSync(file));

			try {
				assert.ok(!writer.readSync(filename).toString());
			} catch(err) {
				assert.ok(err);
			}

			exthandler('unlock', extParams);
		});
	}

	testAsync('base');
	testAsync('addSync', null, function(flow, params) {
		function doWrite() {
			var newfileContent = 'new content:'+flow;
			params.writer.addSync(params.filename, newfileContent);
			assert.ok(fs.existsSync(params.file));
			assert.equal(fs.readFileSync(params.file).toString(), newfileContent);
		}

		if (flow == 'writeEnd') {
			doWrite();
		} else if (flow == 'lock') {
			assert.throws(doWrite);
		}
	});

});




