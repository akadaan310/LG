const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../../packages/domain")];
config.resolver.nodeModulesPaths = [path.join(__dirname, "node_modules")];
config.resolver.extraNodeModules = {
  "@adequate/domain": path.resolve(__dirname, "../../packages/domain/src"),
};
module.exports = config;
