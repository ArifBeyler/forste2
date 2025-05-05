import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';

export default function LoadingScreen({ navigation }: { navigation?: any }) {
  const { completeOnboarding, refreshUser } = useAuth();

  useEffect(() => {
    const finishOnboarding = async () => {
      try {
        // AsyncStorage'a onboarding tamamlandı bilgisini kaydet
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        
        // Onboarding tamamlandı bilgisini güncelle
        await completeOnboarding();
        
        // Kullanıcı bilgilerini yenile
        await refreshUser();
        
        // 2 saniye bekleyip ana sayfaya yönlendir
        setTimeout(() => {
          navigation?.reset({
            index: 0,
            routes: [{ name: 'App' }],
          });
        }, 2000);
      } catch (error) {
        console.error('Onboarding tamamlanırken hata oluştu:', error);
        // Hata olsa bile ana sayfaya yönlendir
        navigation?.reset({
          index: 0,
          routes: [{ name: 'App' }],
        });
      }
    };

    finishOnboarding();
  }, [navigation, completeOnboarding, refreshUser]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Uygulamanız Hazırlanıyor</Text>
          <Text style={styles.description}>
            Sizin için kişisel beslenme ve egzersiz planınız oluşturuluyor. Lütfen bekleyin...
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '80%',
  },
}); 