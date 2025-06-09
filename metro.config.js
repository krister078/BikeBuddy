const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];
defaultConfig.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

// Disable experimental package exports to prevent resolution issues with some libraries
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig; 