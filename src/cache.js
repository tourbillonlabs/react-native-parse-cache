'use strict';

const isNode = typeof window === 'undefined';

const Cacheman = isNode ? require('cacheman') : require('cacheman-memory');

function Cache(cacheName, options) {
  if (!cacheName) throw 'cacheName is required';
  this._cache = new Cacheman(cacheName, options);
}

Cache.prototype.get = function(key, cb) {
  return this._cache.get(key, cb);
};

Cache.prototype.set = function(key, value, ttl, cb) {
  if (ttl === 0) ttl = -1;
  return this._cache.set(key, value, ttl, cb);
};

Cache.prototype.del = function(key, cb) {
  return this._cache.del(key, cb);
};

Cache.prototype.clear = function(cb) {
  return this._cache.clear(cb);
};

Cache.prototype.close = function(cb) {
  this._cache._engine && this._cache._engine.client && this._cache._engine.client.end && this._cache._engine.client.end();
  cb && cb();
  return Promise.resolve();
};

module.exports = function(cacheName, options) {
  return new Cache(cacheName, options);
};
