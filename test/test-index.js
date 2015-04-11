require('debug').enable('cache-file2*');

var assert = require('assert');
var cacheFile = require('../.');

var cache = cacheFile.Cache(__dirname+'/tmp/cahce');
cache.add('cache1.json', function(err, addContent) {
	assert.ok(!err, 'lock err');
	addContent('content', function(err) {
		assert.ok(!err, 'add content err');
	});
});

cache.read('cache1.json', function(err) {
	assert.ok(!!err, 'not lock');
});
