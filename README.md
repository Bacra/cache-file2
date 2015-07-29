node-safe-write  [![Build Status](https://travis-ci.org/Bacra/node-safe-write.svg?branch=master)](https://travis-ci.org/Bacra/node-safe-write)
==================

Store and get files width file locker. It is safe in mulit process.

## Usage

```javascript
var safeWrite = require('safe-write')

safeWrite.add('./file.json', function(err, addContent) {
	addContent('content', function(err) {});
});

safeWrite.add('./file2.json', 'content2', function(err) {});
```

## Methods

Sync methods return the value/throw the error, others don't.  Standard
node fs stuff.

### safeWrite.add(file, [content], [cb])

write file

### safeWrite.addSync(file, [content])

write file sync

### safeWrite.ladd(file, lockfile, options, [content], [cb])

write file width options

### safeWrite.laddSync(file, lockfile, options, [content])

write file sync width options

### safeWrite.read(file, [cb])

read file

### safeWrite.readSync(file)

read file sync

### safeWrite.lread(file, lockfile, options [cb])

read file width options

### safeWrite.lreadSync(file, lockfile, options)

read file sync width options

### safeWrite.status(file)

get file status

### safeWrite.statusSync(file)

get file status sync

### safeWrite.lstatus(file, lockfile, options, [cb])

get file status width options

### safeWrite.lstatusSync(file, lockfile, options)

get file status sync width options

### safeWrite.Writer(root)

get file object for root path 

#### writer.safeRead(filename, [cb])

read file through checking path

#### writer.safeReadSync(filename)

read file sync through checking path

### safeWrite.options()

set lockfile default options

## Options

See [lockfile](https://github.com/npm/lockfile#options)
