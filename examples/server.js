
var http = require('http')
  , url = require('url')
  , os = require('os')
  , filecache = require('..')

filecache.watchChanges = true

filecache(__dirname+'/static', function(err, cache) {
  if(err) throw err
  
  var server = http.createServer()
  server
    .on('listening', function() {
      var addr = this.address()
      console.log('Server listens: http://%s:%s/', os.hostname(), addr.port)
    })
    .on('request', function(req, res) {
      var u = url.parse(req.url)
      if(u.pathname === '/' && cache['/index.html']) {
        // index.html
        res.writeHead(200, {
          'Content-Length': cache['/index.html'].length
        })
        res.write(cache['/index.html'])
      } else if(cache[u.pathname]) {
        // some file
        res.writeHead(200, {
          'Content-Length': cache[u.pathname].length
        })
        res.write(cache[u.pathname])
      } else {
        // 404.html
        res.writeHead(404, {
          'Content-Length': cache['/404.html'].length
        })
        res.write(cache['/404.html'])
      }
      res.end()
    })
  .listen(8081)
  
})
