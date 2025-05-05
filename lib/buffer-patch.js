// Doğrudan buffer paketinden import et
import bufferPkg from 'buffer/';

// Buffer'ı al
const { Buffer } = bufferPkg;

// Global Buffer'ı tanımla
globalThis.Buffer = Buffer;
global.Buffer = Buffer;

// Eski sürümlerde uyumluluğu sağlamak için Buffer.isBuffer metodunu ekle
if (typeof Buffer.isBuffer !== 'function') {
  Buffer.isBuffer = function(obj) {
    return obj != null && obj.constructor === Buffer;
  };
}

// from, alloc ve allocUnsafe metodlarını kontrol et ve tanımla
if (typeof Buffer.from !== 'function') {
  Buffer.from = function(value, encoding) {
    if (encoding) return new Buffer(value, encoding);
    return new Buffer(value);
  };
}

if (typeof Buffer.alloc !== 'function') {
  Buffer.alloc = function(size) {
    return new Buffer(size);
  };
}

if (typeof Buffer.allocUnsafe !== 'function') {
  Buffer.allocUnsafe = function(size) {
    return new Buffer(size);
  };
}

// Buffer örneğinde slice metodu eksikse ekle
if (Buffer.prototype && typeof Buffer.prototype.slice !== 'function') {
  Buffer.prototype.slice = function(start, end) {
    const size = end - start;
    const newBuf = Buffer.alloc(size);
    this.copy(newBuf, 0, start, end);
    return newBuf;
  };
}

export { Buffer };
