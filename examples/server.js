
var options =
  { port: 8081
  , host: false
  , filecache:
    { watchDirectoryChange: true
    , watchFileChange: false
    , hashAlgo: 'sha1'
    , gzip: true
    , deflate: true
    }
  , httpHandler:
    { etag: true
    , lastmod: true
    , expires: 3600000
    , maxAge: 3600 // seconds
    }
  }

var http = require('http')
  , url = require('url')
  , filecache = require('..')

// Create a new filecache
var fc = filecache(options.filecache)

// Print some debug output on change-event
fc.on('change', function(d) {
  console.log(' %s', new Array(11).join('='))
  console.log('      file: %s', d.k)
  console.log('     mtime: %s', d.mtime.toUTCString())
  console.log(' mime-type: %s', d.mime_type)
  console.log('      hash: %s', d.hash ? d.hash : 'N/A')
  console.log('    length: %s bytes', d.length)
  console.log('            %s bytes (gzip)', d.gzip ? d.gzip.length : 'N/A')
  console.log('            %s bytes (deflate)', d.deflate ? d.deflate.length : 'N/A')
  console.log(' full path: %s', d.p)
})

// Load all files of a directory into the cache
fc.load(__dirname+'/static')

// Load a single file into the cache
// Notice the custom options for this file only
fc.load(__dirname+'/test.js', {watchFileChange: true})
fc.load(__dirname+'/test.js', {watchFileChange: true, prefix: '/js'})

// Waits for the ready-event
fc.on('ready', function() {
  // Creates the http request handler
  var httpHandler = fc.httpHandler(options.httpHandler)
  
  // Creates the http-server
  var server = http.createServer()
  
  server
    .on('listening', function() {
      var addr = this.address()
      console.log('Server listens: http://%s:%s/', addr.address, addr.port)
    })
    .on('request', function(req, res) {
      httpHandler(req, res, function(next) {
        if(next === false) {
          return
        }
        res.writeHead(404)
        res.end('404 Not Found')
      })
    })

  if(options.port && options.host) {
    server.listen(options.port, options.host)
  } else {
    server.listen(options.port)
  }
})
