module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "react" }],
    ],
    plugins: [
      [
        "@tamagui/babel-plugin",
        {
          components: ["tamagui"],
          config: "./tamagui.config.ts",
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === "development",
        },
      ],
      // react-native-worklets/plugin MUST be listed last (Reanimated 4 / SDK 54)
      "react-native-worklets/plugin",
    ],
  };
};
