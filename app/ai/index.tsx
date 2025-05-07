import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';
import { useLanguage } from '../../context/LanguageContext';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function AiMainScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  
  // Animasyon değerleri
  const headerOpacity = useSharedValue(0);
  const mainCardOpacity = useSharedValue(0);
  const sectionTitleOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Header animasyonu
    headerOpacity.value = withTiming(1, { duration: 600 });
    
    // Ana kart animasyonu - Kısa bir gecikme ile
    mainCardOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    
    // Bölüm başlığı animasyonu
    sectionTitleOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
  }, []);
  
  // Animasyon stilleri
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [
        { translateY: withTiming(headerOpacity.value * 0 + (1 - headerOpacity.value) * -20, { duration: 600 }) }
      ]
    };
  });
  
  const mainCardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: mainCardOpacity.value,
      transform: [
        { translateY: withTiming(mainCardOpacity.value * 0 + (1 - mainCardOpacity.value) * 20, { duration: 600 }) }
      ]
    };
  });
  
  const sectionTitleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: sectionTitleOpacity.value,
      transform: [
        { translateY: withTiming(sectionTitleOpacity.value * 0 + (1 - sectionTitleOpacity.value) * 20, { duration: 600 }) }
      ]
    };
  });

  function navigateTo(screen: string) {
    router.push(`/ai/${screen}`);
  }

  function goBack() {
    router.back();
  }

  // Ana sayfaya gitme fonksiyonu
  function goToHome() {
    router.push("/");
  }

  // Her bir kart için gecikmeli animasyon
  const getAnimationDelay = (index: number) => {
    return 600 + (index * 100); // Temel gecikme + her kart için 100ms ek gecikme
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={goToHome} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Asistan</Text>
          <TouchableOpacity onPress={() => navigateTo('history')} style={styles.headerButton}>
            <Ionicons name="time" size={24} color="#333333" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Yapay zeka asistanınız size yardımcı olmak için hazır</Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.mainCard, mainCardAnimatedStyle]}>
          <TouchableOpacity 
            style={styles.mainCardTouchable} 
            onPress={() => navigateTo('chat')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconContainer, { backgroundColor: '#FFE8E8' }]}>
              <Ionicons name="chatbubble-ellipses" size={28} color="#FF5A5A" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Forste AI ile sohbet</Text>
              <Text style={styles.cardDescription}>
                Yapay zeka ile sohbet edin, sorular sorun ve yardım alın
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.sectionTitle, sectionTitleAnimatedStyle]}>
          <Text style={styles.sectionTitleText}>AI Özellikleri</Text>
        </Animated.View>

        <View style={styles.gridContainer}>
          <View style={styles.row}>
            <AnimatedTouchableOpacity 
              style={styles.gridCard} 
              onPress={() => navigateTo('image-generator')}
              activeOpacity={0.8}
              entering={FadeInUp.delay(getAnimationDelay(0)).springify()}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#E8F5E8' }]}>
                <Ionicons name="image" size={24} color="#5AB377" />
              </View>
              <Text style={styles.gridCardTitle}>Fotoğraf Üret</Text>
              <Text style={styles.gridCardDescription}>AI ile görsel oluşturun</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity 
              style={styles.gridCard} 
              onPress={() => navigateTo('translate')}
              activeOpacity={0.8}
              entering={FadeInUp.delay(getAnimationDelay(1)).springify()}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#E8F0FF' }]}>
                <Ionicons name="globe" size={24} color="#5A8CFF" />
              </View>
              <Text style={styles.gridCardTitle}>Çeviri Yap</Text>
              <Text style={styles.gridCardDescription}>Metinleri tercüme edin</Text>
            </AnimatedTouchableOpacity>
          </View>

          <View style={styles.row}>
            <AnimatedTouchableOpacity 
              style={styles.gridCard} 
              onPress={() => navigateTo('dream')}
              activeOpacity={0.8}
              entering={FadeInUp.delay(getAnimationDelay(2)).springify()}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#F0E8FF' }]}>
                <Ionicons name="moon" size={24} color="#A85AFF" />
              </View>
              <Text style={styles.gridCardTitle}>Rüya Yorumla</Text>
              <Text style={styles.gridCardDescription}>Rüyalarınızı analiz edin</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity 
              style={styles.gridCard} 
              onPress={() => navigateTo('note')}
              activeOpacity={0.8}
              entering={FadeInUp.delay(getAnimationDelay(3)).springify()}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#FFF8E8' }]}>
                <Ionicons name="document-text" size={24} color="#FFB800" />
              </View>
              <Text style={styles.gridCardTitle}>Not Çıkart</Text>
              <Text style={styles.gridCardDescription}>Metinlerden özet çıkarın</Text>
            </AnimatedTouchableOpacity>
          </View>

          <View style={styles.row}>
            <AnimatedTouchableOpacity 
              style={styles.gridCard} 
              onPress={() => navigateTo('recipe')}
              activeOpacity={0.8}
              entering={FadeInUp.delay(getAnimationDelay(4)).springify()}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#E8FFF8' }]}>
                <Ionicons name="restaurant" size={24} color="#00B8A9" />
              </View>
              <Text style={styles.gridCardTitle}>Tarif Ver</Text>
              <Text style={styles.gridCardDescription}>Yemek tarifleri alın</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity 
              style={styles.gridCard} 
              onPress={() => navigateTo('text-correction')}
              activeOpacity={0.8}
              entering={FadeInUp.delay(getAnimationDelay(5)).springify()}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#FFE8F0' }]}>
                <Ionicons name="create" size={24} color="#FF5A8C" />
              </View>
              <Text style={styles.gridCardTitle}>Metin Düzelt</Text>
              <Text style={styles.gridCardDescription}>Yazılarınızı düzeltin</Text>
            </AnimatedTouchableOpacity>
          </View>

          <View style={styles.row}>
            <AnimatedTouchableOpacity 
              style={styles.gridCard} 
              onPress={() => navigateTo('problem-solving')}
              activeOpacity={0.8}
              entering={FadeInUp.delay(getAnimationDelay(6)).springify()}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#E8FAFF' }]}>
                <Ionicons name="bulb" size={24} color="#00B2FF" />
              </View>
              <Text style={styles.gridCardTitle}>Problem Çöz</Text>
              <Text style={styles.gridCardDescription}>Sorunlarınıza çözüm bulun</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity 
              style={styles.gridCard} 
              onPress={() => navigateTo('summarize')}
              activeOpacity={0.8}
              entering={FadeInUp.delay(getAnimationDelay(7)).springify()}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#F5E8FF' }]}>
                <Ionicons name="book" size={24} color="#B45AFF" />
              </View>
              <Text style={styles.gridCardTitle}>Metni Özetle</Text>
              <Text style={styles.gridCardDescription}>Uzun metinleri özetleyin</Text>
            </AnimatedTouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F8FAFE',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  mainCardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  gridContainer: {
    flex: 0,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    marginBottom: 4,
  },
  gridCardDescription: {
    fontSize: 12,
    color: '#666666',
  },
}); 