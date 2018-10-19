# parse-cache #

#### Parse SDK caching for cloud code or browser that actually works. ####

[![Build Status](https://travis-ci.org/back4app/parse-cache.svg)](https://travis-ci.org/back4app/parse-cache)

## About ##

A Parse caching module that works exactly how you would expect it to, with the latest version of Parse SDK. It can be used on cloud code (memory or redis storages) or client Browser code (memory storage only).

## Important: ##

#### This module was tested using parse-server 2.8.4 and Parse SDK 2.1. There is no warranty using it on versions before these ones. ####

## Usage ##

```javascript
const Parse = require('parse/node'); // or require('parse') if you are on a Browser
const parseCache = require('parse-cache');

parseCache(Parse, 'MyUniqueAppNameOrKey', {
  engine: 'redis',    /* If you don't specify the redis engine,      */
  port: 6379,         /* the query results will be cached in memory (on browser use memory storage). */
  host: 'localhost'
});

const RecordObject = Parse.Object.extend('Record');
const query = new Parse.Query(RecordObject); // or const query = new Parse.Query('Record');

query
  .cache(30) // The number of seconds to cache the query.  Defaults to 60 seconds.
  .equalTo('someField', 'someValue')
  .find(); // you can use find, first, count, countDocuments, estimatedDocumentCount, aggregate, each, get or distinct
  
```

You can also pass a custom key into the `.cache()` method, which you can then use later to clear the cached content.

```javascript
query
  .cache(30, 'some_custom_cache_key') // The number of seconds to cache the query.  Defaults to 60 seconds.
  .equalTo('someField', 'someValue')
  .find();

```

Insert `.cache()` into the queries before `find, first, count, countDocuments, estimatedDocumentCount, aggregate, each, get or distinct` if you want to cache, and they will be cached.  Works with `select`, `ascending`, `descending`, and anything else that will modify the results of a query.

## Clearing the cache ##

If you want to clear the cache for a specific query, you must specify the cache key yourself:

```js
query
  .cache(30, 'some_custom_cache_key')
  .find();

parseCache.clearCache('some_custom_cache_key').then(doSomething);

// or using async/await
async function clearCache(key) {
  await parseCache.clearCache(key);
}
```

If you call `parseCache.clearCache(null, cb) or await parseCache.clearCache()` without passing a cache key as the first parameter, the entire cache will be cleared for all queries.

## Test ##
npm test
