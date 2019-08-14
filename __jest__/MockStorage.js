export default class MockStorage {
  constructor(cache = {}) {
    this.storageCache = cache;
  }

  setItem = (key, value, callback) => {
    let error = null;
    let res = null;
    if (typeof key !== 'string' || typeof value !== 'string') {
      error = new Error('key and value must be string');
    } else {
      this.storageCache[key] = value;
      res = true;
    }
    if (typeof callback === 'function') {
      callback(error, res);
    } else {
      return new Promise((resolve, reject) => {
        return error ? reject(error) : resolve(res);
      });
    }
  };

  getItem = (key, callback) => {
    let res = null;
    if (this.storageCache.hasOwnProperty(key)) {
      res = this.storageCache[key];
    }
    if (typeof callback === 'function') {
      callback(null, res);
    } else {
      return new Promise(resolve => {
        return resolve(res);
      });
    }
  };

  multiGet = (keys, callback) => {
    let res = null;
    let error = null;
    if (Array.isArray(keys)) {
      res = keys.map(k => [k, this.storageCache[k]]);
    } else {
      error = new Error('List of keys must be array');
    }
    if (typeof callback === 'function') {
      callback(error, res);
    } else {
      return new Promise((resolve, reject) => {
        return error ? reject(error) : resolve(res);
      });
    }
  };

  multiSet = (keyValuePairs, callback) => {
    const res = keyValuePairs.forEach(([key, value]) => {
      this.storageCache[key] = value;
    });
    if (typeof callback === 'function') {
      callback(null, res);
    } else {
      return new Promise(resolve => {
        return resolve(res);
      });
    }
  };

  multiRemove = (keys, callback) => {
    const res = keys.forEach(key => delete this.storageCache[key]);
    if (typeof callback === 'function') {
      callback(null, res);
    } else {
      return new Promise(resolve => {
        return resolve(res);
      });
    }
  };

  removeItem = (key, callback) => {
    let res = null;
    let error = null;
    if (this.storageCache.hasOwnProperty(key)) {
      res = delete this.storageCache[key];
    } else {
      error = new Error('No such key!');
    }
    if (typeof callback === 'function') {
      callback(error, res);
    } else {
      return new Promise((resolve, reject) => {
        return error ? reject(error) : resolve(res);
      });
    }
  };

  clear = (key, callback) => {
    this.storageCache = {};
    if (typeof callback === 'function') {
      callback(null, null);
    } else {
      return new Promise(resolve => resolve(true));
    }
  };

  getAllKeys = (key, callback) => {
    let res = Object.keys(this.storageCache);
    if (typeof callback === 'function') {
      callback(null, res);
    } else {
      return new Promise(resolve => resolve(res));
    }
  };
}
