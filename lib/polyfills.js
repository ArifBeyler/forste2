// Node.js modüllerini direkt import et
import Buffer from 'buffer/';
import crypto from 'crypto-browserify';
import events from 'events';
import process from 'process/browser';
import url from 'react-native-url-polyfill/';
import stream from 'stream-browserify';

// Node modüllerini toplu olarak tanımla
const nodeLibs = {
  buffer: Buffer,
  process: process,
  events: events,
  stream: stream,
  crypto: crypto,
  url: url,
  // Diğer modüller
  fs: null,
  path: null,
  os: null
};

// Temel Node.js modülleri için global değişkenleri ayarla
global.Buffer = global.Buffer || Buffer.Buffer;

// Process'i global olarak ayarla
global.process = global.process || process;

// İhtiyaç duyulan diğer modüller için özel olarak import et
import { ReadableStream, TransformStream, WritableStream } from 'web-streams-polyfill/ponyfill';

// Stream modülünü web streams ile zenginleştir
const enhancedStream = {
  ...stream,
  ReadableStream,
  WritableStream,
  TransformStream
};

// Global stream değişkenini ayarla
global.stream = enhancedStream;

// Diğer global değişkenleri ayarla
global.crypto = global.crypto || crypto;
global.events = events;
global.http = null; // React Native'de HTTP modülünü doğrudan kullanmayacağız
global.https = null; // React Native'de HTTPS modülünü doğrudan kullanmayacağız
global.url = url;

// require.resolve için güvenlik yaması
if (typeof global.require === 'function' && typeof global.require.resolve !== 'function') {
  global.require.resolve = function(module) {
    return module;
  };
}

// ReactNative için webpack resolve
if (typeof global.__webpack_require__ === 'undefined') {
  global.__webpack_require__ = function() {
    return {};
  };
}

// Buffer.isBuffer güvenlik kontrolü
if (typeof global.Buffer === 'function' && !global.Buffer.isBuffer) {
  global.Buffer.isBuffer = function(obj) {
    return obj != null && obj.constructor != null && 
           typeof obj.constructor.isBuffer === 'function' && 
           obj.constructor.isBuffer(obj);
  };
}

// Dışa aktarma - nodeLibs compatible API
export default {
  ...nodeLibs,
  stream: enhancedStream,
  ReadableStream,
  WritableStream,
  TransformStream,
  Buffer: global.Buffer,
  process: global.process,
  crypto: global.crypto
};

