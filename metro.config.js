const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config")

const defaultConfig = getDefaultConfig(__dirname)

const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, "mkv", "mp4", "webm", "avi", "mov", "m4v", "flv", "wmv"],
  },
}

module.exports = mergeConfig(defaultConfig, config)
