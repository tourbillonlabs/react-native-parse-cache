'use strict';

const generateKey = require('./generate-key');

module.exports = function(Parse, cache) {
  const originalOperations = {
    find: Parse.Query.prototype.find,
    first: Parse.Query.prototype.first,
    count: Parse.Query.prototype.count,
    countDocuments: Parse.Query.prototype.countDocuments,
    estimatedDocumentCount: Parse.Query.prototype.estimatedDocumentCount,
    aggregate: Parse.Query.prototype.aggregate,
    each: Parse.Query.prototype.each,
    get: Parse.Query.prototype.get,
    distinct: Parse.Query.prototype.distinct,
  };

  Object.keys(originalOperations).forEach((operation) => {
    Parse.Query.prototype[operation] = function() {
      if (!this.hasOwnProperty('_ttl')) return originalOperations[operation].apply(this, arguments);

      this.args = arguments;
      this.operation = operation;

      const key = this._key || this.getCacheKey();
      const ttl = this._ttl;
      const isNotParseObjects = ['distinct', 'count', 'countDocuments', 'estimatedDocumentCount'].includes(operation);
      const model = this.className;

      return new Promise((resolve, reject) => {
        cache.get(key, (err, cachedResults) => { //eslint-disable-line handle-callback-err
          if (cachedResults != null) {
            if (isNotParseObjects) {
              return resolve(cachedResults);
            }
            const inflate = inflateModel({ Parse, model });
            cachedResults = Array.isArray(cachedResults) ? cachedResults.map(inflate) : inflate(cachedResults);

            return resolve(cachedResults);
          }

          originalOperations[operation]
            .apply(this, arguments)
            .then((results) => {
              cache.set(key, results, ttl, () => {
                return resolve(results);
              });
            })
            .catch((err) => {
              reject(err);
            });
        });
      });
    };
  });

  Parse.Query.prototype.cache = function(ttl = 60, customKey = '') {
    if (typeof ttl === 'string') {
      customKey = ttl;
      ttl = 60;
    }

    this._ttl = ttl;
    this._key = customKey;
    return this;
  };

  Parse.Query.prototype.getCacheKey = function() {
    const key = {
      operation: this.operation,
      model: this.className,
      args: this.args,
      skip: this._skip,
      limit: this._limit,
      sort: this._order,
      select: this._select,
      extraOptions: this._extraOptions,
      where: this._where
    };

    return generateKey(key);
  };
};

function inflateModel({ Parse, model }) {
  return (data) => {
    data.__type = data.__type || 'Object';
    data.className = data.className || model;
    const obj = Parse.Object.fromJSON(data);
    obj.fromCache = true;
    return obj;
  };
}
