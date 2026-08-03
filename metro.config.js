const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const ignoreRegex = /node_modules_broken/;

// Ignore during module resolution
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList || []),
  ignoreRegex
];

// Completely ignore during filesystem watching to prevent the OS 'lstat' crash
config.watchPathIgnorePatterns = [ignoreRegex];

module.exports = config;
