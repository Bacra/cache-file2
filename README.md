node-safe-write  [![Build Status](https://travis-ci.org/Bacra/node-safe-write.svg?branch=master)](https://travis-ci.org/Bacra/node-safe-write)
==================

Store and get files width file locker. It is safe in mulit process.

## Usage

```javascript
const safeWrite = require('safe-write')
safeWrite('./file.json', 'newContent').then(() => {});
safeWrite.sync('./file.json', 'newContent');
```
