require('debug').enable('safe-write*');

var assert = require('assert');
var safeWrite = require('../.');

var writer = safeWrite.Writer(__dirname+'/tmp/cahce');
writer.add('file1.json', function(err, addContent) {
	assert.ok(!err, 'lock err');
	addContent('content', function(err) {
		assert.ok(!err, 'add content err');
	});
});

writer.read('file1.json', function(err) {
	assert.ok(!!err, 'not lock');
});

assert.throws(function() {
	writer.readSync('file1.json');
}, 'not lock');

assert.throws(function() {
	writer.addSync('file1.json', 'content2');
}, 'not lock');
