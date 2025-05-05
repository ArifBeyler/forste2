import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Index() {
  const { session, loading, user } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeSession, setActiveSession] = useState(false);

  // Oturum kontrolü ve onboarding durumu
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsChecking(true);
        setCheckingSession(true);
        
        // 1. Önce aktif bir oturum var mı kontrol et
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          console.log("Ana sayfada aktif bir oturum bulundu!");
          setActiveSession(true);
          setCheckingSession(false);
          setIsChecking(false);
          return; // Aktif oturum varsa, diğer kontrollere gerek yok
        }
        
        setCheckingSession(false);
        
        // 2. Onboarding durumunu kontrol et
        try {
          const onboardingStatus = await AsyncStorage.getItem('onboardingCompleted');
          setOnboardingCompleted(onboardingStatus === 'true');
        } catch (error) {
          console.error('Onboarding durumu kontrol edilirken hata:', error);
          setOnboardingCompleted(false);
        }
        
        setIsChecking(false);
      } catch (error) {
        console.error('Uygulama başlatılırken hata:', error);
        setIsChecking(false);
        setCheckingSession(false);
      }
    };

    if (!loading) {
      initializeApp();
    }
  }, [loading]);

  // Yükleniyor durumu
  if (loading || isChecking || checkingSession) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Uygulama başlatılıyor...</Text>
      </View>
    );
  }

  // 1. Eğer aktif bir oturum bulunduysa veya kullanıcı oturum açmışsa direkt ana sayfaya yönlendir
  if (activeSession || session) {
    console.log("Aktif oturum var, ana sayfaya yönlendiriliyor");
    return <Redirect href="/(tabs)" />;
  }

  // 2. Kullanıcı oturum açmamışsa:
  // Onboarding tamamlanmadıysa, onboarding ekranına yönlendir
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }
  
  // Onboarding tamamlandıysa, login ekranına yönlendir
  return <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#777777',
  }
}); 