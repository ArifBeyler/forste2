// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Node.js modülleri için genişletilmiş resolver ayarları
config.resolver.extraNodeModules = {
  // Temel Node.js modülleri
  buffer: path.resolve(__dirname, 'node_modules/buffer'),
  process: path.resolve(__dirname, 'node_modules/process'),
  stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
  crypto: path.resolve(__dirname, 'node_modules/crypto-browserify'),
  events: path.resolve(__dirname, 'node_modules/events'),
  
  // Alias tanımlamaları
  'buffer/': path.resolve(__dirname, 'node_modules/buffer'),
  
  // Web streams için
  'web-streams-polyfill': path.resolve(__dirname, 'node_modules/web-streams-polyfill'),
  'web-streams-polyfill/ponyfill': path.resolve(__dirname, 'node_modules/web-streams-polyfill/dist/ponyfill.js'),
  
  // Supabase realtime sahte modül
  '@supabase/realtime-js': path.resolve(__dirname, 'lib/supabase-mock.js'),
  '@supabase/realtime-js/dist/main/lib/transformers': path.resolve(__dirname, 'lib/supabase-mock.js'),
};

module.exports = config; 