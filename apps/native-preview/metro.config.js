// Lets Metro resolve the shared design tokens from the monorepo's packages/ folder.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.join(repoRoot, 'packages')];
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules')];
config.resolver.extraNodeModules = {
  '@adequate/design-tokens': path.join(repoRoot, 'packages/design-tokens/src'),
  '@adequate/mock-content': path.join(repoRoot, 'packages/mock-content/src'),
};

module.exports = config;
