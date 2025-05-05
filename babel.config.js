module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            // Node.js modülleri için doğrudan alias'lar
            stream: 'stream-browserify',
            crypto: 'crypto-browserify',
            events: 'events',
            buffer: 'buffer',
            'buffer/': 'buffer',
            // HTTP ve HTTPS React Native'de kullanılmaz
            http: false,
            https: false,
            url: 'react-native-url-polyfill',
            // Web streams için alias'lar
            'web-streams-polyfill/ponyfill': 'web-streams-polyfill/dist/ponyfill.js',
            // Supabase realtime sahte modül
            '@supabase/realtime-js': './lib/supabase-mock.js',
            '@supabase/realtime-js/dist/main/lib/transformers': './lib/supabase-mock.js',
          },
        },
      ],
    ],
  };
}; 