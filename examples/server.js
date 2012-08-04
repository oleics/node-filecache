
var options =
  { port: 8081
  , host: false
  , caching:
    { etag: true
    , lastmod: true
    , expires: 3600000
    , maxAge: 3600 // seconds
    }
  , filecache:
    { watchDirectoryChange: true
    , watchFileChange: false
    , hashAlgo: 'sha1'
    , gzip: true
    , deflate: true
    }
  }

var http = require('http')
  , url = require('url')
  , filecache = require('..')

// Create a new filecache
var fc = filecache(__dirname+'/static', options.filecache, function(err, cache) {
  if(err) throw err
  
  // Some debug output
  fc.on('change', function(d) {
    console.log(' %s', new Array(11).join('='))
    console.log('      file: %s', d.k)
    console.log('     mtime: %s', d.mtime.toUTCString())
    console.log(' mime-type: %s', d.mime_type)
    console.log('      hash: %s', d.gzip ? d.hash : 'N/A')
    console.log('    length: %s bytes', d.length)
    console.log('            %s bytes (gzip)', d.gzip ? d.gzip.length : 'N/A')
    console.log('            %s bytes (deflate)', d.deflate ? d.deflate.length : 'N/A')
    console.log(' full path: %s', d.p)
  })
  
  // Load a single file into the cache
  // Notice the custom options for this file only
  fc.load(__dirname+'/test.js', {watchFileChange: true}, function() {
    
    var server = http.createServer()
    
    server
      .on('listening', function() {
        var addr = this.address()
        console.log('Server listens: http://%s:%s/', addr.address, addr.port)
      })
      .on('request', function(req, res) {
        var u = url.parse(req.url)
          , statusCode
          , contents
          , headers = {}
        
        if(u.pathname === '/' && cache['/index.html']) {
          u.pathname = '/index.html'
        }
        
        if(!cache[u.pathname]) {
          if(!cache['/404.html']) {
            req.writeHead(404)
            req.end()
            return
          }
          statusCode = 404
          u.pathname = '/404.html'
        } else {
          statusCode = 200
        }
        
        contents = cache[u.pathname]
        headers['Content-Type'] = contents.mime_type
        
        // http cache
        if(options.caching) {
          if(options.caching.etag) {
            if(req.headers['if-none-match'] != null
                && req.headers['if-none-match'] === contents.hash) {
              res.writeHead(304)
              res.end()
              return
            }
            headers['ETag'] = contents.hash
          }
          
          if(options.caching.lastmod) {
            if(req.headers['if-modified-since'] != null
                && new Date(req.headers['if-modified-since']).getTime() === contents.mtime.getTime()) {
              res.writeHead(304)
              res.end()
              return
            }
            headers['Last-Modified'] = contents.mtime.toUTCString()
          }
          
          if(options.caching.expires) {
            headers['Expires'] = new Date(contents.mtime + (options.caching.expires*1000)).toUTCString()
          }
          
          if(options.caching.maxAge) {
            headers['Max-Age'] = options.caching.maxAge
          }
          
          headers['Cache-Control'] = 'public'
        }
        
        // http encoding
        if((contents.gzip || contents.deflate) && req.headers['accept-encoding']) {
          var ae = req.headers['accept-encoding'].match(new RegExp('(gzip|deflate)', 'g'))
          
          if(contents.gzip
              && ae.indexOf('gzip') !== -1
              && contents.gzip.length < contents.length) {
            contents = contents.gzip
            headers['Content-Encoding'] = 'gzip'
          } else 
          if(contents.deflate
              && ae.indexOf('deflate') !== -1
              && contents.deflate.length < contents.length) {
            contents = contents.deflate
            headers['Content-Encoding'] = 'deflate'
          }
        }
        
        headers['Content-Length'] = contents.length
        res.writeHead(statusCode, headers)
        res.end(contents)
      })
    
    if(options.port && options.host) {
      server.listen(options.port, options.host)
    } else {
      server.listen(options.port)
    }
  })
  
})
