
Filecache
=========

Simple in-memory filecache for node.js

Installation
------------

``npm install filecache``

Usage Examples
--------------

```js
var filecache = require('filecache')

// Enable automatic reload of files on change
filecache.watchChanges = true

// Get notifyed when a change occured
filecache.notifyChange(function(relativePath) {
  console.log('File %s changed.', shortPath)
})

// Create a cache with every file below 'path/to/dir'
filecache('path/to/dir', function(err, cache) {
  // cache is a object with relative paths as its keys
  console.log(cache['/some/file.txt'])
})
```

See [server.js](https://github.com/oleics/node-filecache/tree/master/examples/server.js)
in the examples directory for a ultra lightweight
and lightning fast node.js http webserver serving static files.

MIT License
-----------

Copyright (c) 2012 Oliver Leics <oliver.leics@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
