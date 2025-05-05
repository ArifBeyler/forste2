import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const { width, height } = Dimensions.get('window');

export default function Onboarding() {
  const { t } = useLanguage();
  const { completeOnboarding, session } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useSharedValue(1);

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

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      // Animasyon efekti için
      fadeAnim.value = 0;
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        setCurrentIndex(currentIndex + 1);
        fadeAnim.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      }, 200);
    } else {
      // Son slayt ise, onboarding'i tamamlayıp giriş ekranına yönlendir
      handleCompleteOnboarding();
    }
  };

  const handleSkip = () => {
    handleCompleteOnboarding();
  };

  const handleCompleteOnboarding = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      // AsyncStorage'a onboarding tamamlandı bilgisini kaydet
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      
      // Eğer kullanıcı oturum açmışsa, Supabase'e de tamamlandı bilgisini gönder
      if (session) {
        const { success, error } = await completeOnboarding();
        if (!success && error) {
          console.error('Onboarding durumu güncellenirken hata:', error);
        }
      }
      
      // Kullanıcının oturum durumuna göre yönlendirme yap
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Onboarding tamamlanırken hata oluştu:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const renderItem = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
        <Animated.View style={[animatedStyle, styles.slideContent]}>
          <Text style={styles.slideTitle}>
            {item.title}
          </Text>
          <Text style={styles.slideDescription}>
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
      />
      <SafeAreaView style={styles.footer}>
        <View style={styles.footerContent}>
          {currentIndex < slides.length - 1 ? (
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex ? styles.paginationDotActive : {}
                ]}
              />
            ))}
          </View>
          <Button
            title={currentIndex === slides.length - 1 ? t('welcome.getStarted') : t('onboarding.next')}
            onPress={handleNext}
            variant="primary"
            size="sm"
            isLoading={isCompleting}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    width: width,
  },
  slideContent: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
  },
  slideDescription: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  skipText: {
    color: '#666666',
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
  },
  paginationDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#EEEEEE',
  },
  paginationDotActive: {
    backgroundColor: '#FF5A5A',
  },
}); 