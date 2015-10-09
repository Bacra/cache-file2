node-safe-write  [![Build Status](https://travis-ci.org/Bacra/node-safe-write.svg?branch=master)](https://travis-ci.org/Bacra/node-safe-write)
==================

Store and get files width file locker. It is safe in mulit process.

## Usage

```javascript
var safeWrite = require('safe-write')

safeWrite.write('./file.json', 'newContent', 'oldContent', function(err) {});

safeWrite.read('./file2.json', function(err, content) {});
```

## Methods

### safeWrite.write(file, newContent[, oldContent][, callback][, ignoreUnlockErr])

write file width file lock.

return Promise Object.

### safeWrite.fastWrite(file, newContent[, oldContent][, callback])

wirte file widthout file lock.

return Promise Object.

### safeWrite.read(file[, callback][, ignoreUnlockErr])

read file with file lock.

return Promise Object.

## Options

See [lockfile](https://github.com/npm/lockfile#options)
