
Filecache
=========

### Simple in-memory filecache for node.js

See [server.js](https://github.com/oleics/node-filecache/tree/master/examples/server.js)
in the examples directory for a ultra lightweight and lightning
fast node.js http webserver serving static files.

Installation
------------

``npm install filecache``

Usage Examples
--------------

Simple:

```js
var filecache = require('filecache')

// Create a cache with every file below 'path/to/dir'
filecache('path/to/dir', function(err, cache) {
  // cache is a object with relative paths as its keys
  console.log(cache['/some/file.txt'])
})
```

Advanced:

```js
var filecache = require('filecache')

// Create a new in-memory filecache
var fc = filecache()

// Set some defaults
fc.options
( { watchDirectoryChanges: true
  , watchFileChanges: false
  , hashAlgo: 'sha1'
  , gzip: true
  , deflate: true
  }
)

// Get notifyed when a change occured
fc.on('change', function(d) {
  console.log('! file changed')
  console.log('     full path: %s', d.p)
  console.log(' relative path: %s', d.k)
  console.log('        length: %s bytes', d.length)
  console.log('                %s bytes (gzip)', d.gzip.length)
  console.log('                %s bytes (deflate)', d.deflate.length)
  console.log('     mime-type: %s', d.mime_type)
  console.log('         mtime: %s', d.mtime.toUTCString())
})

// Create a cache with every file below 'path/to/dir'
fc.load('path/to/dir', function(err, cache) {
  // cache is an object with relative paths as its keys
  console.log(cache['/some/file.txt'])
})

// Create a cache for a specific file
fc.load('path/to/file', function(err, cache) {
  console.log(cache['/file'])
})
```

See [server.js](https://github.com/oleics/node-filecache/tree/master/examples/server.js)
in the examples directory for a ultra lightweight and lightning
fast node.js http webserver serving static files.

Options
-------

``watchDirectoryChanges`` (default: false)  
Automatic reload of files within a directory.

watchFileChanges (default: false)  
Automatic reload of a changed file.

hashAlgo (default: false)  
Algorithm to use for hashsum.

gzip (default: false)
gzip-encode the file-contents.

deflate (default: false)
deflate-encode the file-contents.

MIT License
-----------

Copyright (c) 2012 Oliver Leics <oliver.leics@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
