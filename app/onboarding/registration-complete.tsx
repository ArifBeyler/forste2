// Expo router'ı kaldırıyorum
// import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function RegistrationComplete({ navigation }: { navigation?: any }) {
  const { t } = useLanguage();
  const { user, refreshUser, completeRegistration } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Sayfa yüklendiğinde kullanıcı bilgilerini yenile
  useEffect(() => {
    const checkUserSession = async () => {
      // Birkaç kez kullanıcı bilgilerini yenilemeyi dene
      let isSuccess = await refreshUser();
      
      // Başarısız olursa, biraz bekleyip tekrar dene
      if (!isSuccess) {
        setTimeout(async () => {
          await refreshUser();
        }, 1000);
      }
    };
    
    checkUserSession();
  }, [refreshUser]);
  
  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'Değerli Kullanıcı';

  // yeni bir stack başlatarak eski ekranlara geri dönmeyi engelliyoruz
  const handleStart = () => {
    navigation?.reset({
      index: 0,
      routes: [{ name: 'HealthInfo' }],
    });
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      // Kayıt sürecini tamamla ve ana sayfaya yönlendir
      const { success, error } = await completeRegistration();
      
      if (success) {
        // Ana sayfaya yönlendirme (App stack'ine git)
        navigation?.reset({
          index: 0,
          routes: [{ name: 'App' }],
        });
      } else {
        console.error('Kayıt tamamlanırken hata oluştu:', error);
      }
    } catch (error) {
      console.error('Kayıt tamamlama işlemi sırasında hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="check-circle" size={60} color="#10B981" />
        </View>
        
        <Text style={styles.title}>Tebrikler!</Text>
        <Text style={styles.description}>
          Tüm bilgileriniz başarıyla kaydedildi. Şimdi uygulamayı kullanmaya başlayabilirsiniz.
        </Text>
        
        <Button 
          title="Hemen Başla"
          onPress={handleComplete}
          loading={isLoading}
          style={styles.button}
        />
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: '85%',
  },
  button: {
    width: '100%',
    marginTop: 16,
  },
}); 