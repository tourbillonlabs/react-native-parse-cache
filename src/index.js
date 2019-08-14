import CacheStore from 'react-native-cache-store';

let hasRun = false;

module.exports = async function init(Parse) {
  if (hasRun) {
    return;
  }
  hasRun = true;

  require('./extend-query')(Parse, CacheStore);
};

module.exports.clearCache = async function(customKey, cb) {
  if (!customKey) {
    await CacheStore.flush();
  }
  await CacheStore.remove(customKey);
};

module.exports.close = async function(cb) {
  return await CacheStore.flush();
};
