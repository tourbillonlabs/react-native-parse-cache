# react-native-parse-cache #

#### Parse SDK caching for cloud code or browser that works with react-native. ####

This is a fork of the Back4App [parse-cache](https://github.com/back4app/parse-cache) module that has been modified for use with `Parse/react-native`, and uses [`react-native-cache-store`](https://github.com/cheeaun/react-native-cache-store) for storage.

## Installation ##

```bash
npm install react-native-parse-cache --save
```

## Usage ##

```javascript
import Parse from 'parse/react-native';
import ParseCache from 'react-native-parse-cache';

ParseCache(Parse);

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

ParseCache.clearCache('some_custom_cache_key').then(doSomething);

// or using async/await
async function clearCache(key) {
  await ParseCache.clearCache(key);
}
```

If you call `ParseCache.clearCache(null, cb) or await ParseCache.clearCache()` without passing a cache key as the first parameter, the entire cache will be cleared for all queries.
