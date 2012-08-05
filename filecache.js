"use strict";

module.exports = filecache

var fs = require('fs')
  , path = require('path')
  , mime = require('mime')
  , EventEmitter = require('events').EventEmitter
  , crypto = require('crypto')
  , zlib = require('zlib')
  , util = require('util')
  , httpHandler = require('./http-handler')

function prepare(d, options, cb) {
  if(options.hashAlgo) {
    var hash = crypto.createHash(options.hashAlgo)
    hash.update(d)
    d.hash = hash.digest('hex')
  }
  
  if(options.gzip) {
    zlib.gzip(d, function(err, r) {
      if(err) return cb(err)
      
      d.gzip = r
      if(options.deflate) {
        zlib.deflate(d, function(err, r) {
          if(err) return cb(err)
          
          d.deflate = r
          cb(null, d)
        })
      } else {
        cb(null, d)
      }
    })
  } else if(options.deflate) {
    zlib.deflate(d, function(err, r) {
      if(err) return cb(err)
      
      d.deflate = r
      cb(null, d)
    })
  } else {
    cb(null, d)
  }
}

function generate(p, options, em) {
  var start = p
    , queue = [start]
  
  read()
  
  function read() {
    if(queue.length === 0) {
      em.emit('done', start)
      return
    }
    
    var p = queue.shift()
    // console.log(p)
    
    fs.stat(p, function(err, s) {
      if(err) return em.emit('error', err)
      
      if(s.isDirectory()) {
        
        fs.readdir(p, function(err, files) {
          if(err) return em.emit('error', err)
          
          if(!options.root) {
            options.root = p
          }
          
          if(options.watchDirectoryChange) {
            var watcher = fs.watch(p)
            watcher.on('change', function(event, filename) {
              // console.log('watcher change: %s, %s (%s)', event, filename, p)
              watcher.close()
              generate(p, options, em)
            })
          }
          
          queue = queue.concat(files.map(function(f) {
            return path.resolve(p, f)
          }))
          
          read()
        })
      } else {
        fs.readFile(p, function(err, d) {
          if(err) return em.emit('error', err)
          
          if(!options.root) {
            options.root = path.dirname(p)
          }
          
          d.p = p
          d.k = (options.prefix ? options.prefix : '') + (options.root ? p.slice(options.root.length) : p).replace(/\\/g, '/')
          d.mtime = s.mtime
          d.mime_type = mime.lookup(p)
          
          prepare(d, options, function(err, d) {
            if(err) return em.emit('error', err)
            
            if(options.watchFileChange) {
              var watcher = fs.watch(p)
              watcher.on('change', function(event, filename) {
                console.log('watcher change: %s, %s (%s)', event, filename, p)
                watcher.close()
                generate(p, options, em)
              })
            }
            
            em.emit('contents', d)
            
            read()
          })
        })
      }
    })
  }
}

function genOptions(options, defaults) {
  Object.keys(defaults).forEach(function(k) {
    if(!options.hasOwnProperty(k)) {
      options[k] = defaults[k]
    }
  })
  return options
}

function filecache(dir, defaultOptions, cb) {
  if(typeof defaultOptions === 'function') {
    cb = defaultOptions
    defaultOptions =
    { prefix: false
    , watchDirectoryChange: false
    , watchFileChange: false
    , gzip: false
    , deflate: false
    , hashAlgo: false
    }
  }
  if(typeof dir === 'function') {
    cb = dir
    dir = null
  }
  if(dir !== null && typeof dir === 'object' && !(dir instanceof String)) {
    defaultOptions = dir
    dir = null
  }
  if(typeof defaultOptions === 'boolean') { // legacy code
    defaultOptions =
    { watchFileChange: defaultOptions
    , hashAlgo: 'sha1'
    }
  }
  
  cb = cb || function() {}
  
  var cache = {}
    , em = new EventEmitter()
  
  em.cache = cache
  
  em.on('contents', function(d) {
    if(cache[d.k] && cache[d.k].p !== d.p) {
      console.warn('WARN: Filecache key %s has multiple sources.', d.k)
    }
    cache[d.k] = d
    em.emit('change', d)
  })
  
  em.options = function(options) {
    Object.keys(options).forEach(function(k) {
      defaultOptions[k] = options[k]
    })
  }
  
  var pending = 0
  
  em.load = function(p, options, cb) {
    ++pending

    if(typeof options === 'function') {
      cb = options
      options = {}
    }
    
    options = genOptions(options||{}, defaultOptions)
    
    p = path.resolve(p)
    
    function onDone(_p) {
      if(_p === p) {
        em.removeListener('done', onDone)
        cb && cb(null, cache)
        if(--pending === 0) {
          em.emit('ready', cache)
        }
      }
    }
    em.on('done', onDone)
    
    generate(p, options, em)
    
    return em
  }
  
  if(dir) {
    em.load(dir, cb)
  }
  
  em.httpHandler = function(options) {
    return httpHandler(options, em)
  }
  
  return em
}
