node-cache-file2  [![Build Status](https://travis-ci.org/Bacra/node-cache-file2.svg?branch=master)](https://travis-ci.org/Bacra/node-cache-file2)
==================

Store and get files from cache.

## Usage

```javascript
var cacheFile = require('cache-file2')

cacheFile.add('./cache.json', function(err, addContent) {
	addContent('content', function(err) {});
});

cacheFile.add('./cache2.json', 'content2', function(err) {});
```

## Methods

Sync methods return the value/throw the error, others don't.  Standard
node fs stuff.

### cacheFile.add(file, [content], [cb])

write cache file

### cacheFile.addSync(file, [content])

write cache file sync

### cacheFile.ladd(file, lockfile, options, [content], [cb])

write cache file width options

### cacheFile.laddSync(file, lockfile, options, [content])

write cache file sync width options

### cacheFile.read(file, [cb])

read cache file

### cacheFile.readSync(file)

read cache file sync

### cacheFile.lread(file, lockfile, options [cb])

read cache file width options

### cacheFile.lreadSync(file, lockfile, options)

read cache file sync width options

### cacheFile.status(file)

get cache status

### cacheFile.statusSync(file)

get cache status sync

### cacheFile.lstatus(file, lockfile, options, [cb])

get cache status width options

### cacheFile.lstatusSync(file, lockfile, options)

get cache status sync width options

### cacheFile.Cache(root)

get cache object for root path 

#### cache.safeRead(filename, [cb])

read cache file through checking path

#### cache.safeReadSync(filename)

read cache file sync through checking path

### cacheFile.options();

set lockfile default options

## Options

See [lockfile](https://github.com/npm/lockfile#options)
