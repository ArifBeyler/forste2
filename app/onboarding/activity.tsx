import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

// Aktivite seviyeleri
const ACTIVITY_LEVELS = [
  { 
    id: 'low', 
    label: 'Düşük (Masa başı)', 
    icon: 'desk', 
    description: 'Gün içinde çoğunlukla oturuyorsunuz ve minimum fiziksel aktivite yapıyorsunuz.' 
  },
  { 
    id: 'medium', 
    label: 'Orta (Gün içinde hareketli)', 
    icon: 'walk', 
    description: 'Gün içinde düzenli olarak hareket ediyorsunuz veya haftada 1-3 kez egzersiz yapıyorsunuz.' 
  },
  { 
    id: 'high', 
    label: 'Yüksek (Aktif)', 
    icon: 'run-fast', 
    description: 'Haftada 3-5 kez egzersiz yapıyorsunuz veya fiziksel olarak yorucu bir işiniz var.' 
  },
];

// Spor dalları
const SPORTS = [
  { id: 'swimming', label: 'Yüzme', icon: 'swim' },
  { id: 'running', label: 'Koşu', icon: 'run' },
  { id: 'cycling', label: 'Bisiklet', icon: 'bike' },
  { id: 'fitness', label: 'Fitness', icon: 'weight-lifter' },
  { id: 'yoga', label: 'Yoga', icon: 'yoga' },
  { id: 'pilates', label: 'Pilates', icon: 'human-female' },
  { id: 'basketball', label: 'Basketbol', icon: 'basketball' },
  { id: 'football', label: 'Futbol', icon: 'soccer' },
  { id: 'tennis', label: 'Tenis', icon: 'tennis' },
  { id: 'volleyball', label: 'Voleybol', icon: 'volleyball' },
  { id: 'hiking', label: 'Doğa Yürüyüşü', icon: 'hiking' },
  { id: 'martialArts', label: 'Dövüş Sanatları', icon: 'karate' },
];

export default function ActivityScreen({ navigation }: { navigation?: any }) {
  const { updateProfile, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    activityLevel: '',
    sports: [],
  });
  const [error, setError] = useState('');

  const validateForm = (): boolean => {
    if (!formData.activityLevel) {
      setError('Lütfen aktivite seviyenizi seçin');
      return false;
    }
    return true;
  };

  const toggleSport = (sportId: string) => {
    if (formData.sports.includes(sportId)) {
      setFormData({
        ...formData,
        sports: formData.sports.filter((id) => id !== sportId),
      });
    } else {
      setFormData({
        ...formData,
        sports: [...formData.sports, sportId],
      });
    }
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    
    // Eğer zaten yükleme durumundaysa, işlemi tekrarlamayı önle
    if (isLoading) return;

    setIsLoading(true);
    setError(''); // Hata mesajını temizle
    
    try {
      // Aktivite bilgilerini güncelle
      const { success, error } = await updateProfile({
        userInfo: {
          activityLevel: formData.activityLevel,
          favouriteSports: formData.sports
        }
      });
      
      if (success) {
        // Bir sonraki ekrana geç
        navigation.navigate('Allergies');
      } else {
        // Hata durumunda kullanıcıya bilgi ver
        Alert.alert('Hata', error || 'Bilgileriniz kaydedilirken bir hata oluştu.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.stepText}>Adım 2/4</Text>
          <Text style={styles.title}>Aktivite ve Spor</Text>
          <Text style={styles.subtitle}>
            Egzersiz alışkanlıklarınızı ve sevdiğiniz spor dallarını öğrenmek istiyoruz
          </Text>
        </View>

        <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.card}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Aktivite Seviyesi */}
          <Animated.View entering={SlideInRight.delay(400).duration(500)}>
            <Text style={styles.sectionTitle}>Günlük Aktivite Seviyesi</Text>
            <View style={styles.activityContainer}>
              {ACTIVITY_LEVELS.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    formData.activityLevel === activity.id && styles.activityItemActive,
                  ]}
                  onPress={() => setFormData({ ...formData, activityLevel: activity.id })}
                >
                  <View style={styles.activityHeader}>
                    <MaterialCommunityIcons
                      name={activity.icon}
                      size={24}
                      color={formData.activityLevel === activity.id ? '#FFF' : '#4B5563'}
                    />
                    <Text
                      style={[
                        styles.activityLabel,
                        formData.activityLevel === activity.id && styles.activityLabelActive,
                      ]}
                    >
                      {activity.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.activityDescription,
                      formData.activityLevel === activity.id && styles.activityDescriptionActive,
                    ]}
                  >
                    {activity.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Spor Dalları */}
          <Animated.View entering={SlideInRight.delay(500).duration(500)} style={styles.sportsSection}>
            <Text style={styles.sectionTitle}>Tercih Ettiğiniz Spor Dalları</Text>
            <Text style={styles.sectionSubtitle}>
              Birden fazla seçebilirsiniz
            </Text>
            <View style={styles.sportsGrid}>
              {SPORTS.map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportItem,
                    formData.sports.includes(sport.id) && styles.sportItemActive,
                  ]}
                  onPress={() => toggleSport(sport.id)}
                >
                  <MaterialCommunityIcons
                    name={sport.icon}
                    size={22}
                    color={formData.sports.includes(sport.id) ? '#FFF' : '#4B5563'}
                  />
                  <Text
                    style={[
                      styles.sportLabel,
                      formData.sports.includes(sport.id) && styles.sportLabelActive,
                    ]}
                  >
                    {sport.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleBack}
        >
          <AntDesign name="arrowleft" size={20} color="#6B7280" />
        </TouchableOpacity>
        <Button 
          title="Devam Et" 
          onPress={handleNext} 
          isLoading={isLoading}
          style={styles.buttonPrimary}
        />
      </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  activityItemActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  activityLabelActive: {
    color: '#FFFFFF',
  },
  activityDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  activityDescriptionActive: {
    color: '#FFFFFF',
  },
  sportsSection: {
    marginTop: 8,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sportItem: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  sportItemActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  sportLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 6,
    textAlign: 'center',
  },
  sportLabelActive: {
    color: '#FFFFFF',
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
}); 