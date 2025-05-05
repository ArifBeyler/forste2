/**
 * Node.js polyfill'lerini ayarlayan script
 * npm komutundan önce çalıştırılmalıdır
 */

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

console.log('React Native için Node.js polyfill\'leri ayarlanıyor...');

// Gerekli paketlerin kurulu olduğunu kontrol et
const requiredPackages = [
  'buffer',
  'process',
  'stream-browserify',
  'crypto-browserify',
  'events',
  'node-libs-react-native',
  'react-native-get-random-values',
  'react-native-url-polyfill',
  'patch-package'
];

let needsInstall = false;
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

for (const pkg of requiredPackages) {
  if (!packageJson.dependencies[pkg] && !packageJson.devDependencies[pkg]) {
    console.log(`${pkg} paketi eksik. Yükleniyor...`);
    needsInstall = true;
    break;
  }
}

if (needsInstall) {
  console.log('Eksik paketler yükleniyor...');
  execSync(`npm install ${requiredPackages.join(' ')} --save`, { stdio: 'inherit' });
  console.log('Paketler yüklendi.');
}

// Polyfill klasörünün varlığını kontrol et
const libDir = path.join(__dirname, '..', 'lib');
if (!fs.existsSync(libDir)) {
  console.log('lib klasörü oluşturuluyor...');
  fs.mkdirSync(libDir);
}

// patch-package için patches klasörünün varlığını kontrol et
const patchesDir = path.join(__dirname, '..', 'patches');
if (!fs.existsSync(patchesDir)) {
  console.log('patches klasörü oluşturuluyor...');
  fs.mkdirSync(patchesDir);
}

console.log('Polyfill\'ler başarıyla ayarlandı!');
console.log('Uygulamayı şimdi "npm start" komutu ile başlatabilirsiniz.'); 