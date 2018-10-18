'use strict';

let hasRun = false;
let cache;

module.exports = function init(Parse, cacheName, cacheOptions = {}) {
  if (hasRun) return;
  hasRun = true;

  init._cache = cache = require('./cache')(cacheName, cacheOptions);

  require('./extend-query')(Parse, cache);
};

module.exports.clearCache = function(customKey, cb) {
  if (!customKey) {
    return cache.clear(cb);
  }
  return cache.del(customKey, cb);
};

module.exports.close = function(cb) {
  return cache.close(cb);
};
