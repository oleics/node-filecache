
module.exports = filecache

var fs = require('fs')
  , path = require('path')

function filecache(dir, cb) {
  dir = path.resolve(dir)
  var queue = [dir]
    , cache = {}
  
  function read() {
    if(queue.length === 0) return cb(null, cache)
    p = queue.shift()
    fs.stat(p, function(err, s) {
      if(err) return cb(err)
      
      if(s.isDirectory()) {
        console.log('isDirectory', p)
        fs.readdir(p, function(err, files) {
          if(err) return cb(err)
          queue = queue.concat(files.map(function(f) {
            return path.resolve(p, f)
          }))
          read()
        })
      } else {
        console.log('isFile', p)
        fs.readFile(p, function(err, d) {
          if(err) return cb(err)
          var pp = p.slice(0)
            , k = pp.slice(dir.length).replace(/\\/g, '/')
          cache[k] = d
          
          if(filecache.watchChanges) {
            fs.watch(pp, function() {
              fs.readFile(pp, function(err, d) {
                if(err) return console.error(err.stack||err)
                var was = cache[k]
                cache[k] = d
                _notifyer(k, cache[k], was, cache, dir)
              })
            })
          }
          
          read()
        })
      }
    })
  }
  
  read()
}

filecache.watchChanges = false
filecache.notifyChange = notify

var _notifyer = function() {}
function notify(cb) {
  _notifyer = cb || function() {}
}
