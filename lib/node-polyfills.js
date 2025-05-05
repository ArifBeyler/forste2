/**
 * Node.js Polyfills Helper
 * React Native için Node.js modüllerini polyfill eden yardımcı modül
 */

// Browser process için boş bir süreç tanımla
const browserProcess = {
  title: 'browser',
  browser: true,
  env: {},
  argv: [],
  version: '',
  versions: {},
  on: () => {},
  addListener: () => {},
  once: () => {},
  off: () => {},
  removeListener: () => {},
  removeAllListeners: () => {},
  emit: () => {},
  binding: () => { throw new Error('process.binding is not supported'); },
  cwd: () => '/',
  chdir: () => { throw new Error('process.chdir is not supported'); },
  umask: () => 0,
  nextTick: (cb) => setTimeout(cb, 0),
  platform: 'reactnative'
};

// Tüm polyfill'leri tek bir yerden yönetiyoruz
import { Buffer } from 'buffer/';
import crypto from 'crypto-browserify';
import events from 'events';
import * as urlPolyfill from 'react-native-url-polyfill';
import stream from 'stream-browserify';
import { ReadableStream, TransformStream, WritableStream } from 'web-streams-polyfill/ponyfill';

// Global nesneleri ayarla
function setupGlobals() {
  // Buffer global tanımı
  if (typeof global.Buffer === 'undefined') {
    global.Buffer = Buffer;
  }
  
  // Buffer yardımcı metodları
  setupBufferPolyfills();
  
  // Process global tanımı
  if (typeof global.process === 'undefined') {
    global.process = browserProcess;
  }
  
  // Stream ve ilgili sınıfları tanımla
  const enhancedStream = { ...stream, ReadableStream, WritableStream, TransformStream };
  global.stream = enhancedStream;
  
  // Diğer Node.js modüllerini tanımla
  global.crypto = global.crypto || crypto;
  global.events = events;

  // require.resolve için güvenlik yaması
  if (typeof global.require === 'function' && typeof global.require.resolve !== 'function') {
    global.require.resolve = function(module) { return module; };
  }
}

// Buffer için ek polyfill'ler
function setupBufferPolyfills() {
  const BufferObj = global.Buffer || Buffer;
  
  // isBuffer metodu
  if (typeof BufferObj.isBuffer !== 'function') {
    BufferObj.isBuffer = function(obj) {
      return obj != null && obj.constructor === BufferObj;
    };
  }
  
  // from metodu
  if (typeof BufferObj.from !== 'function') {
    BufferObj.from = function(value, encoding) {
      if (encoding) return new BufferObj(value, encoding);
      return new BufferObj(value);
    };
  }
  
  // alloc metodu
  if (typeof BufferObj.alloc !== 'function') {
    BufferObj.alloc = function(size) {
      return new BufferObj(size);
    };
  }
  
  // allocUnsafe metodu
  if (typeof BufferObj.allocUnsafe !== 'function') {
    BufferObj.allocUnsafe = function(size) {
      return new BufferObj(size);
    };
  }
  
  // Buffer.prototype.copy metodu
  if (BufferObj.prototype && typeof BufferObj.prototype.copy !== 'function') {
    BufferObj.prototype.copy = function(target, targetStart, sourceStart, sourceEnd) {
      // Hata durumunun önlenmesi
      try {
        if (!target) {
          console.warn('Buffer.prototype.copy: target is undefined');
          return 0;
        }
        
        // Varsayılan değerleri ayarla
        targetStart = targetStart || 0;
        sourceStart = sourceStart || 0;
        sourceEnd = sourceEnd !== undefined ? sourceEnd : (this ? this.length : 0);
        
        // Direkt kopyalama yapamıyoruz, byte'ları tek tek kopyala
        const sourceBuf = this;
        if (!sourceBuf || !sourceBuf.length) {
          return 0;
        }
        
        let copied = 0;
        for (let i = 0; i < sourceEnd - sourceStart; i++) {
          if (sourceBuf[sourceStart + i] !== undefined) {
            target[targetStart + i] = sourceBuf[sourceStart + i];
            copied++;
          }
        }
        
        return copied;
      } catch (e) {
        console.warn('Buffer.copy hata:', e);
        return 0;
      }
    };
  }
  
  // Buffer prototype slice metodu
  if (BufferObj.prototype && typeof BufferObj.prototype.slice !== 'function') {
    BufferObj.prototype.slice = function(start, end) {
      // Hata durumunun önlenmesi
      try {
        if (!this) {
          console.warn('Buffer.prototype.slice: this is undefined');
          return BufferObj.alloc(0);
        }
        
        // Varsayılan değerleri ayarla
        start = start || 0;
        end = end !== undefined ? end : (this.length || 0);
        
        const size = Math.max(0, end - start);
        const newBuf = BufferObj.alloc(size);
        
        // Kaynak buf kontrolü
        if (!this.length) {
          return newBuf;
        }
        
        // Manuel kopyalama
        for (let i = 0; i < size; i++) {
          if (this[start + i] !== undefined) {
            newBuf[i] = this[start + i];
          }
        }
        
        return newBuf;
      } catch (e) {
        console.warn('Buffer.slice hata:', e);
        return BufferObj.alloc(0);
      }
    };
  }
}

// Polyfill'leri başlat
export function initNodePolyfills() {
  // Global nesneleri ayarla
  setupGlobals();
  
  // URL polyfill'lerini başlat
  urlPolyfill.default;
  
  console.log('Node.js polyfill\'leri başarıyla yüklendi');
  
  return {
    Buffer,
    process: browserProcess,
    stream,
    crypto,
    events,
    ReadableStream,
    WritableStream,
    TransformStream
  };
}

// Otomatik başlatma - import edildiğinde çalışır
const nodePolyfills = initNodePolyfills();

export default nodePolyfills; 