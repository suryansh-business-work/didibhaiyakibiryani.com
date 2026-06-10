// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Tamagui works with the default Metro config in Expo SDK 52.
// CSS-style imports are not needed on native; web uses the metro web bundler.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
