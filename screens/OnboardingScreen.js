import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');
const SLIDE_DURATION = 3000; // Her slayt 3 saniye gösterilecek

export default function OnboardingScreen({ navigation }) {
  const { t } = useLanguage();
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);
  const timerRef = useRef(null);

  const slides = [
    {
      id: '1',
      title: t('onboarding.step1.title'),
      description: t('onboarding.step1.description'),
      backgroundColor: '#F0F9FF',
    },
    {
      id: '2',
      title: t('onboarding.step2.title'),
      description: t('onboarding.step2.description'),
      backgroundColor: '#F0FDF4',
    },
    {
      id: '3',
      title: t('onboarding.step3.title'),
      description: t('onboarding.step3.description'),
      backgroundColor: '#FEF2F2',
    },
  ];

  const completeOnboardingProcess = async () => {
    try {
      console.log('Son animasyon tamamlandı, Login ekranına geçiliyor');
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      
      // Supabase'de kullanıcının onboarding durumunu tamamlandı olarak güncelle
      const { success, error } = await completeOnboarding();
      
      if (!success && error) {
        console.error('Onboarding durumu güncellenirken hata:', error);
      }
      
      navigation.navigate('Login');
    } catch (error) {
      console.error('completeOnboarding içinde hata:', error);
    }
  };

  const startAutoSlide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (currentIndex < slides.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        completeOnboardingProcess();
      }
    }, SLIDE_DURATION);
  };

  useEffect(() => {
    // İlk slayt için animasyonu başlat
    slideAnim.value = withTiming(1, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });

    // İlk timer'ı başlat
    startAutoSlide();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // currentIndex değiştiğinde animasyonu başlat
    if (currentIndex > 0) {
      fadeAnim.value = 0;
      slideAnim.value = 0;

      // Fade in ve slide in animasyonu
      fadeAnim.value = withTiming(1, {
        duration: 500,
        easing: Easing.in(Easing.cubic)
      });
      slideAnim.value = withTiming(1, {
        duration: 500,
        easing: Easing.in(Easing.cubic)
      });

      // Yeni timer başlat
      startAutoSlide();
    }
  }, [currentIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [
        {
          scale: withTiming(fadeAnim.value, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          })
        },
        {
          translateY: withTiming(
            (1 - slideAnim.value) * 50,
            {
              duration: 500,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1)
            }
          )
        }
      ]
    };
  });

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.slide, { backgroundColor: currentSlide.backgroundColor }]}>
        <Animated.View style={[animatedStyle, styles.slideContent]}>
          <Text style={styles.slideTitle}>
            {currentSlide.title}
          </Text>
          <Text style={styles.slideDescription}>
            {currentSlide.description}
          </Text>
        </Animated.View>
      </View>
      <SafeAreaView style={styles.footer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentIndex ? '#3B82F6' : '#F3F4F6' }
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  slideContent: {
    alignItems: 'center'
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24
  },
  slideDescription: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 32
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4
  }
}); 