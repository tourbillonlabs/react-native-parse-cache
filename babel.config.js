module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['module:metro-react-native-babel-preset'],
    env: {
      development: {
        presets: ['module:react-native-dotenv', 'module:metro-react-native-babel-preset'],
      },
    },
  };
};
