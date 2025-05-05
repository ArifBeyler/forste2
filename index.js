// React Native temel importları
import React from 'react';
import { AppRegistry } from 'react-native';

// Ana uygulama bileşeni
import App from './App';

// Expo kayıt fonksiyonu
import { registerRootComponent } from 'expo';

// Ana bileşeni doğrudan AppRegistry ile kaydet
AppRegistry.registerComponent('main', () => App);

// Ayrıca registerRootComponent ile de kaydet
registerRootComponent(App); 