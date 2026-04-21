const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);
const rorkConfig = withRorkMetro(config);

// Ensure 'web' platform is always present so Metro resolves .web.ts stubs
// (withRorkMetro may strip it, causing "Unable to resolve widgetTaskHandler" on web)
if (!rorkConfig.resolver.platforms.includes('web')) {
  rorkConfig.resolver.platforms = [...rorkConfig.resolver.platforms, 'web'];
}

module.exports = rorkConfig;
