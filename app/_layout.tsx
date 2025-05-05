import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import * as FontAwesome from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';

// Splash ekranını görünür tut
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Fontları yükle
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Fontlar yüklendiyse splash ekranını gizle
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // AppState değişikliklerini dinle (arka plandan dönünce yanıp sönme sorununu çözmek için)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Uygulamaya dönüş yapıldığında render'ı zorla
        setTimeout(() => {
          // Boş
        }, 0);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Fontlar yüklenene kadar hiçbir şey gösterme
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <LanguageProvider>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <StatusBar style="dark" />
              <View style={styles.contentContainer}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#FFFFFF' },
                    animation: 'fade',
                  }}
                >
                  {/* Onboarding Ekranları */}
                  <Stack.Screen
                    name="onboarding/index"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  
                  {/* Auth Ekranları */}
                  <Stack.Screen
                    name="auth/login"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="auth/register"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  
                  {/* Ana Ekranlar */}
                  <Stack.Screen
                    name="(tabs)"
                    options={{
                      headerShown: false,
                      animation: 'none', // Flash sorununu önlemek için
                      animationDuration: 0, // Animasyon süresini 0'a indirerek yanıp sönmeyi engelle
                    }}
                  />
                  <Stack.Screen name="user-info/index" options={{ headerShown: false, animation: 'none' }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', animation: 'fade' }} />
                </Stack>
              </View>
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 100, // TabBar yüksekliği için ekstra boşluk bırak
  },
});

