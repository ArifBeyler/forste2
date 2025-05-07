import { CommonActions } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';

export default function AiLayout({ navigation }) {
  const router = useRouter();
  
  // React Navigation'ın hazır olup olmadığını kontrol et
  const isNavigationReady = navigation && typeof navigation.addListener === 'function';

  // React Navigation ile expo-router arasında koordinasyon sağlama
  useEffect(() => {
    // Eğer navigation hazır değilse, useEffect'i çalıştırma
    if (!isNavigationReady) return;
    
    // Geri butonu için özel dinleyici
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Eğer event türü 'GO_BACK' ise ve expo-router tarafından ise
      if (e.data.action.type === 'GO_BACK') {
        try {
          // Expo Router'ı kullanarak ana sayfaya dön
          router.replace('/');
          // Varsayılan navigasyon davranışını önle
          e.preventDefault();
        } catch (error) {
          console.log('Geri dönüş hatası:', error);
          // Hata durumunda React Navigation'ı kullanmaya çalış
          if (navigation) {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }]
              })
            );
          }
        }
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigation, router, isNavigationReady]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="chat"
        options={{
          title: 'AI Chat Sohbet',
          headerShown: true,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Geçmiş',
          headerShown: true,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="image-generator"
        options={{
          title: 'Resim Üret',
          headerShown: true,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="note"
        options={{
          title: 'Not Çıkart',
          headerShown: true,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="dream"
        options={{
          title: 'Rüya Yorumlama',
          headerShown: true,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
} 