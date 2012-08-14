"use strict";

var filecache = require('filecache')
  , url = require('url')
  , regExp_AcceptEncoding = new RegExp('(gzip|deflate)', 'g')

module.exports = create

function create(options, fc) {
  if(!(options != null)) {
    options =
    { etag: true
    , lastmod: true
    , expires: 3600000 // milliseconds
    , maxAge: 3600     // seconds
    }
  }
  
  var cache = fc.cache
  
  function handleRequest(req, res, next) {
    var u = url.parse(req.url)
      , statusCode
      , contents
      , headers = {}
    
    req.urlparts = u
    
    // lookup the contents to serve
    if(u.pathname === '/' && cache['/index.html']) {
      u.pathname = '/index.html'
    }
    
    // handles file-not-found
    if(!cache[u.pathname]) {
      if(!cache['/404.html']) {
        // user-defined handler
        if(options.handler) {
          return options.handler(req, res, next)
        }
        
        if(next) {
          return next()
        }
        
        req.writeHead(404)
        req.end()
        return
      }
      statusCode = 404
      u.pathname = '/404.html'
    } else {
      statusCode = 200
    }
    
    // sets the content to serve
    contents = cache[u.pathname]
    headers['Content-Type'] = contents.mime_type
    
    // http cache
    if(options) {
      if(options.etag) {
        if(req.headers['if-none-match'] != null
            && req.headers['if-none-match'] === contents.hash) {
          res.writeHead(304)
          res.end()
          return next && next(false)
        }
        headers['ETag'] = contents.hash
      }
      
      if(options.lastmod) {
        if(req.headers['if-modified-since'] != null
            && new Date(req.headers['if-modified-since']).getTime() === contents.mtime.getTime()) {
          res.writeHead(304)
          res.end()
          return next && next(false)
        }
        headers['Last-Modified'] = contents.mtime.toUTCString()
      }
      
      if(options.expires) {
        headers['Expires'] = new Date(contents.mtime + (options.expires*1000)).toUTCString()
      }
      
      if(options.maxAge) {
        headers['Max-Age'] = options.maxAge
      }
      
      headers['Cache-Control'] = 'public'
    }
    
    // http encoding
    if((contents.gzip || contents.deflate) && req.headers['accept-encoding']) {
      var ae = req.headers['accept-encoding'].match(regExp_AcceptEncoding)
      
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
    
    // sends the contents
    headers['Content-Length'] = contents.length
    res.writeHead(statusCode, headers)
    res.end(contents)
    
    next && next(false)
  }
  
  return handleRequest
}
