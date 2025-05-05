import { AntDesign, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

// Su ihtiyacı hesaplama formülü
function calculateWaterNeeds(weight: number, activityLevel: string): number {
  // Temel su ihtiyacı: Kilo x 35 ml
  let waterNeeds = weight * 35;

  // Aktivite seviyesine göre ekstra su ihtiyacı
  switch (activityLevel) {
    case 'low':
      // Düşük aktivite için ekstra yok
      break;
    case 'medium':
      // Orta aktivite için %15 ekstra
      waterNeeds += waterNeeds * 0.15;
      break;
    case 'high':
      // Yüksek aktivite için %30 ekstra
      waterNeeds += waterNeeds * 0.3;
      break;
    default:
      break;
  }

  // Sonucu ml olarak yuvarla
  return Math.round(waterNeeds);
}

// Hatırlatma sıklık seviyeleri
const REMINDER_FREQUENCIES = [
  { id: 'low', label: 'Az', count: 3, icon: 'water-outline' },
  { id: 'medium', label: 'Orta', count: 6, icon: 'water' },
  { id: 'high', label: 'Çok Sık', count: 10, icon: 'water-plus' },
];

// Konfeti parçası bileşeni
const Confetti = ({ startX, startDelay, color, size }: { startX: number, startDelay: number, color: string, size: number }) => {
  const translateY = useSharedValue(-10);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Konfeti parçasını animasyonla düşür
    translateY.value = withDelay(
      startDelay,
      withTiming(500, { duration: 3000 + Math.random() * 2000 })
    );

    // Konfeti sallanarak düşsün
    translateX.value = withDelay(
      startDelay,
      withSequence(
        withTiming(startX - 30 + Math.random() * 60, { duration: 1000 }),
        withTiming(startX + 30 + Math.random() * 60, { duration: 1000 }),
        withTiming(startX - 20 + Math.random() * 40, { duration: 1000 })
      )
    );

    // Konfeti dönsün
    rotate.value = withDelay(
      startDelay,
      withRepeat(
        withTiming(2 * Math.PI * (Math.random() > 0.5 ? 1 : -1), { duration: 2000 }),
        -1
      )
    );

    // Konfeti görünür olsun
    opacity.value = withDelay(
      startDelay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(
          2000,
          withTiming(0, { duration: 1000 })
        )
      )
    );

    // Konfeti boyutu
    scale.value = withDelay(
      startDelay,
      withSpring(1, { damping: 10 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: size / 2,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate.value}rad` },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  return <Animated.View style={animatedStyle} />;
};

export default function Hydration({ navigation }: { navigation?: any }) {
  const { user, updateProfile, completeOnboarding, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [waterNeedsCalculated, setWaterNeedsCalculated] = useState(0);
  const [waterNeeds, setWaterNeeds] = useState(2000); // Varsayılan değer
  const [sleepHours, setSleepHours] = useState(8); // Varsayılan uyku saati
  const [formData, setFormData] = useState({
    enableReminders: true,
    reminderFrequency: 'medium', // Az, Orta, Çok Sık
  });
  const [error, setError] = useState('');
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);

  // İkon animasyonları için değerler
  const iconTranslateY = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const iconScale = useSharedValue(1);

  // Konfeti renkleri
  const CONFETTI_COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#FBBF24', '#EC4899', '#8B5CF6'];
  
  // Konfeti parçaları için Array
  const confetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    startX: -140 + Math.random() * 280, // Pozisyonu
    startDelay: Math.random() * 1000, // Başlama gecikmesi
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)], // Rengi
    size: 5 + Math.random() * 10, // Boyutu
  }));

  // Kullanıcının kilo ve aktivite seviyesi bilgilerini al ve su ihtiyacını hesapla
  useEffect(() => {
    const calculateUserWaterNeeds = async () => {
      try {
        if (user?.user_metadata) {
          const weight = user.user_metadata.weight ? parseInt(user.user_metadata.weight) : 70;
          const activityLevel = user.user_metadata.activityLevel || 'medium';
          
          // Su ihtiyacını hesapla
          const calculatedNeeds = calculateWaterNeeds(weight, activityLevel);
          setWaterNeedsCalculated(calculatedNeeds);
          setWaterNeeds(calculatedNeeds);
        }
      } catch (error) {
        console.error('Su ihtiyacı hesaplanırken hata oluştu:', error);
        // Hata durumunda varsayılan değer kullan
        setWaterNeeds(2000);
      }
    };

    calculateUserWaterNeeds();
  }, [user]);

  // Seçilen hatırlatma sıklığına göre günde kaç bildirim olacağını hesapla
  const getReminderCount = () => {
    const frequency = REMINDER_FREQUENCIES.find(f => f.id === formData.reminderFrequency);
    return frequency ? frequency.count : 6; // Varsayılan orta seviye
  };

  const handleComplete = async () => {
    // İşlem zaten devam ediyorsa, tekrar tetiklemeyi engelle
    if (isLoading || isCompletingOnboarding) return;
    
    setIsLoading(true);
    setError(''); // Mevcut hata mesajlarını temizle
    
    try {
      // Hydration bilgilerini kaydet
      const updatePromise = updateProfile({ 
        userInfo: {
          hydration: {
            reminderFrequency: formData.reminderFrequency,
            targetAmount: waterNeeds
          }
        }
      });
      
      // Timeout promise oluştur
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('İşlem zaman aşımına uğradı')), 10000);
      });
      
      // İlk tamamlanan promise'i al
      const updateResult = await Promise.race([
        updatePromise,
        timeoutPromise.then(() => ({ success: false, error: 'İşlem çok uzun sürdü. Lütfen tekrar deneyin.' }))
      ]) as { success: boolean, error: string | null };
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Bilgiler kaydedilemedi');
      }
      
      // Kullanıcı bilgilerini hızlıca yenile
      await refreshUser(1);
      
      // Onboarding sürecini tamamla
      const completePromise = completeOnboarding();
      
      // Onboarding tamamlama için de timeout ekle
      const completeResult = await Promise.race([
        completePromise,
        timeoutPromise.then(() => ({ success: false, error: 'Onboarding tamamlama aşaması zaman aşımına uğradı.' }))
      ]) as { success: boolean, error: string | null };
      
      if (!completeResult.success) {
        throw new Error(completeResult.error || 'Onboarding tamamlanamadı');
      }
      
      // Başarılı olduğunda tebrik ekranını göster
      setIsCompletingOnboarding(true);
      
      // Artık otomatik kapatma yok, kullanıcı butonla kapatacak
      
    } catch (err) {
      console.error('Profiliniz güncellenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Profiliniz güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAfterComplete = () => {
    // Kayıt tamamlama ekranına geç
    navigation?.navigate('RegistrationComplete');
  };

  const handleBack = () => {
    navigation?.goBack();
  };

  const formatWaterAmount = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)} L`;
    }
    return `${ml} ml`;
  };

  const increaseWaterNeeds = () => {
    const newValue = waterNeeds + 100;
    setWaterNeeds(newValue > 5000 ? 5000 : newValue);
  };

  const decreaseWaterNeeds = () => {
    const newValue = waterNeeds - 100;
    setWaterNeeds(newValue < 1000 ? 1000 : newValue);
  };

  // Tebrik ekranı gösterildiğinde animasyonları başlat
  useEffect(() => {
    if (isCompletingOnboarding) {
      // Yukarı aşağı hareket animasyonu
      iconTranslateY.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Sonsuz tekrar
        true // Reverse
      );
      
      // Hafif dönme animasyonu
      iconRotate.value = withRepeat(
        withSequence(
          withTiming(-0.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.05, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Sonsuz tekrar
        true // Reverse
      );
      
      // Hafif büyüme-küçülme animasyonu
      iconScale.value = withRepeat(
        withSequence(
          withDelay(
            400,
            withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          withDelay(
            400,
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
          )
        ),
        -1, // Sonsuz tekrar
        true // Reverse
      );
    } else {
      // Animasyonları sıfırla
      iconTranslateY.value = 0;
      iconRotate.value = 0;
      iconScale.value = 1;
    }
  }, [isCompletingOnboarding]);

  // İkon için animasyon stillerini hazırla
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: iconTranslateY.value },
        { rotate: `${iconRotate.value}rad` },
        { scale: iconScale.value }
      ]
    };
  });

  const handleNext = async () => {
    try {
      // Hidrasyon bilgilerini güncelle
      const { success, error } = await updateProfile({
        userInfo: {
          dailyWaterGoal: waterNeeds, // Kullanıcının belirlediği günlük su hedefi
          sleepHours: sleepHours // Varsayılan uyku saati 
        }
      });
      
      if (success) {
        // Son ekrana geç
        navigation.navigate('RegistrationComplete');
      } else {
        // Hata durumunda kullanıcıya bilgi ver
        Alert.alert('Hata', error || 'Bilgileriniz kaydedilirken bir hata oluştu.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.stepText}>Adım 4/4</Text>
          <Text style={styles.title}>Su İhtiyacı</Text>
          <Text style={styles.subtitle}>
            Sağlıklı yaşam için günlük su tüketimi çok önemli. Size özel hesaplanan günlük su ihtiyacı ve hatırlatıcı ayarlarınızı yapabilirsiniz.
          </Text>
        </View>

        <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.card}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Su İhtiyacı */}
          <Animated.View entering={SlideInRight.delay(400).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Günlük Su İhtiyacınız</Text>
            <Text style={styles.sectionSubtitle}>
              Boy, kilo ve aktivite seviyenize göre hesaplanmıştır. İsterseniz değiştirebilirsiniz.
            </Text>
            
            <View style={styles.waterNeedsContainer}>
              <TouchableOpacity 
                style={styles.waterAdjustButton}
                onPress={decreaseWaterNeeds}
              >
                <AntDesign name="minus" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <View style={styles.waterValueContainer}>
                <MaterialCommunityIcons name="cup-water" size={30} color="#3B82F6" style={styles.waterIcon} />
                <Text style={styles.waterValue}>{formatWaterAmount(waterNeeds)}</Text>
                <Text style={styles.waterLabel}>günlük</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.waterAdjustButton}
                onPress={increaseWaterNeeds}
              >
                <AntDesign name="plus" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {waterNeedsCalculated !== waterNeeds && (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => setWaterNeeds(waterNeedsCalculated)}
              >
                <AntDesign name="reload1" size={14} color="#3B82F6" />
                <Text style={styles.resetButtonText}>Önerilen değere sıfırla ({formatWaterAmount(waterNeedsCalculated)})</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Hatırlatıcı Ayarı */}
          <Animated.View entering={SlideInRight.delay(500).duration(500)} style={styles.section}>
            <View style={styles.reminderHeaderRow}>
              <View style={styles.reminderHeaderText}>
                <Text style={styles.sectionTitle}>Su Hatırlatıcısı</Text>
                <Text style={styles.sectionSubtitle}>
                  Düzenli su içmeniz için hatırlatıcıları aktif edin
                </Text>
              </View>
              
              <Switch
                value={formData.enableReminders}
                onValueChange={(value) => setFormData({ ...formData, enableReminders: value })}
                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                thumbColor={formData.enableReminders ? '#3B82F6' : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
            
            {formData.enableReminders && (
              <View style={styles.reminderFrequencyContainer}>
                <Text style={styles.reminderFrequencyTitle}>Hatırlatma Sıklığı</Text>
                
                <View style={styles.frequencyOptions}>
                  {REMINDER_FREQUENCIES.map((frequency) => (
                    <TouchableOpacity
                      key={frequency.id}
                      style={[
                        styles.frequencyOption,
                        formData.reminderFrequency === frequency.id && styles.frequencyOptionActive,
                      ]}
                      onPress={() => setFormData({ 
                        ...formData, 
                        reminderFrequency: frequency.id 
                      })}
                    >
                      <MaterialCommunityIcons
                        name={frequency.icon}
                        size={24}
                        color={formData.reminderFrequency === frequency.id ? '#FFF' : '#6B7280'}
                      />
                      <View style={styles.frequencyTextContainer}>
                        <Text
                          style={[
                            styles.frequencyLabel,
                            formData.reminderFrequency === frequency.id && styles.frequencyLabelActive,
                          ]}
                        >
                          {frequency.label}
                        </Text>
                        <Text
                          style={[
                            styles.frequencyCount,
                            formData.reminderFrequency === frequency.id && styles.frequencyCountActive,
                          ]}
                        >
                          Günde {frequency.count} hatırlatma
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleBack}
          disabled={isLoading}
        >
          <AntDesign name="arrowleft" size={20} color="#6B7280" />
        </TouchableOpacity>
        <Button 
          title="Tamamla" 
          onPress={handleNext} 
          isLoading={isLoading}
          style={styles.continueButton}
        />
      </View>

      {isCompletingOnboarding && (
        <Animated.View 
          entering={FadeIn.duration(300)} 
          style={styles.loadingOverlay}
        >
          <Animated.View 
            entering={SlideInRight.duration(400)} 
            style={styles.loadingCard}
          >
            {/* Konfeti parçaları */}
            {confetti.map((item) => (
              <Confetti
                key={item.id}
                startX={item.startX}
                startDelay={item.startDelay}
                color={item.color}
                size={item.size}
              />
            ))}
            
            <Animated.View style={animatedIconStyle}>
              <FontAwesome5 name="glass-cheers" size={40} color="#FF6B00" style={styles.loadingIcon} />
            </Animated.View>
            <Text style={styles.loadingTitle}>Tebrikler!</Text>
            <Text style={styles.loadingText}>
              Tüm bilgileriniz başarıyla kaydedildi. Forste deneyiminize başlamak üzeresiniz...
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinueAfterComplete}
            >
              <Text style={styles.continueButtonText}>Devam Et</Text>
              <AntDesign name="arrowright" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  stepText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  waterNeedsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  waterAdjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterIcon: {
    marginBottom: 8,
  },
  waterValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  waterLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 6,
  },
  reminderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reminderHeaderText: {
    flex: 1,
    paddingRight: 16,
  },
  reminderFrequencyContainer: {
    marginTop: 16,
  },
  reminderFrequencyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  frequencyOptions: {
    flexDirection: 'column',
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  frequencyOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  frequencyTextContainer: {
    marginLeft: 12,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  frequencyLabelActive: {
    color: '#FFFFFF',
  },
  frequencyCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  frequencyCountActive: {
    color: '#E5E7EB',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 12,
  },
  buttonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 1000,
    elevation: 5,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
}); 