
module.exports = filecache

var fs = require('fs')
  , path = require('path')
  , mime = require('mime')
  , EventEmitter = require('events').EventEmitter
  , crypto = require('crypto')
  , lstat = process.platform === 'win32' ? 'stat' : 'lstat'
  ;


function hash(d) {
  var hash = crypto.createHash('sha1')
  hash.update(d)
  return hash.digest('hex')
}

function filecache(dir, watchChanges, cb) {
  if(typeof watchChanges === 'function') {
    cb = watchChanges
    watchChanges = false
  }
  cb = cb || function() {}
  dir = path.resolve(dir)
  
  var queue = [dir]
    , cache = {}
    , em = new EventEmitter()
    ;
  
  function handleError(err) {
    em.emit('error', err)
    cb(err)
  }
  
  function read() {
    if(queue.length === 0) {
      em.emit('ready', cache)
      return cb(null, cache)
    }
    
    p = queue.shift()
    
    fs.stat(p, function(err, s) {
      if(err) return handleError(err)
      
      if(s.isDirectory()) {
        fs.readdir(p, function(err, files) {
          if(err) return handleError(err)
          queue = queue.concat(files.map(function(f) {
            return path.resolve(p, f)
          }))
          read()
        })
      } else {
        fs.readFile(p, function(err, d) {
          if(err) return handleError(err)
          var pp = p.slice(0)
            , k = pp.slice(dir.length).replace(/\\/g, '/')
            ;
          
          cache[k] = d
          cache[k].hash = hash(d)
          cache[k].mtime = s.mtime
          cache[k].mime_type = mime.lookup(pp)
          
          if(watchChanges) {
            fs.watch(pp, function() {
              fs.stat(pp, function(err, s) {
                if(err) return em.emit('error', err)
                
                fs.readFile(pp, function(err, d) {
                  if(err) return em.emit('error', err)
                  
                  var was = cache[k]
                  
                  cache[k] = d
                  cache[k].hash = hash(d)
                  cache[k].mtime = s.mtime
                  cache[k].mime_type = was.mime_type
                  
                  em.emit('change', k, cache[k], was, cache, dir)
                })
              })
            })
          }
          
          read()
        })
      }
    })
  }
  
  read()
  
  return em
}
