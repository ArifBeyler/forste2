import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// Aktivite seviyeleri
const activityLevels = [
  { id: 'low', label: 'Düşük (Hareketsiz yaşam)' },
  { id: 'medium', label: 'Orta (Haftada 1-3 gün egzersiz)' },
  { id: 'high', label: 'Yüksek (Haftada 4+ gün egzersiz)' },
];

// İlgi alanları
const interestTags = [
  { id: 'fitness', label: 'Fitness' },
  { id: 'running', label: 'Koşu' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'meditation', label: 'Meditasyon' },
  { id: 'nutrition', label: 'Beslenme' },
  { id: 'cycling', label: 'Bisiklet' },
  { id: 'swimming', label: 'Yüzme' },
  { id: 'pilates', label: 'Pilates' },
  { id: 'hiking', label: 'Doğa Yürüyüşü' },
  { id: 'dance', label: 'Dans' },
];

// Form veri tipi
interface UserInfo {
  height: string;
  weight: string;
  activityLevel: string;
  interests: string[];
}

enum Step {
  HEIGHT_WEIGHT = 0,
  ACTIVITY_LEVEL = 1,
  INTERESTS = 2,
  SAVING = 3,
}

export default function UserInfo() {
  const { t } = useLanguage();
  const { user, updateProfile, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(Step.HEIGHT_WEIGHT);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    height: '',
    weight: '',
    activityLevel: '',
    interests: [],
  });
  const [errors, setErrors] = useState<{
    height?: string;
    weight?: string;
    activityLevel?: string;
    interests?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Klavyeyi kapat
  useEffect(() => {
    Keyboard.dismiss();
  }, [currentStep]);

  // Boy/kilo değerlerini kontrol et
  const validateHeightWeight = () => {
    const newErrors: {height?: string; weight?: string} = {};
    let isValid = true;

    if (!userInfo.height) {
      newErrors.height = 'Boy bilgisi gerekli';
      isValid = false;
    } else if (isNaN(Number(userInfo.height)) || Number(userInfo.height) <= 0) {
      newErrors.height = 'Geçerli bir boy girin';
      isValid = false;
    }

    if (!userInfo.weight) {
      newErrors.weight = 'Kilo bilgisi gerekli';
      isValid = false;
    } else if (isNaN(Number(userInfo.weight)) || Number(userInfo.weight) <= 0) {
      newErrors.weight = 'Geçerli bir kilo girin';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Aktivite seviyesi seçimini kontrol et
  const validateActivityLevel = () => {
    const newErrors: {activityLevel?: string} = {};
    let isValid = true;

    if (!userInfo.activityLevel) {
      newErrors.activityLevel = 'Aktivite seviyesi seçin';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // İlgi alanlarını kontrol et
  const validateInterests = () => {
    const newErrors: {interests?: string} = {};
    let isValid = true;

    if (userInfo.interests.length === 0) {
      newErrors.interests = 'En az bir ilgi alanı seçin';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // İlerleme düğmesi
  const handleNext = () => {
    switch (currentStep) {
      case Step.HEIGHT_WEIGHT:
        if (validateHeightWeight()) {
          setCurrentStep(Step.ACTIVITY_LEVEL);
        }
        break;
      case Step.ACTIVITY_LEVEL:
        if (validateActivityLevel()) {
          setCurrentStep(Step.INTERESTS);
        }
        break;
      case Step.INTERESTS:
        if (validateInterests()) {
          setCurrentStep(Step.SAVING);
          saveUserInfo();
        }
        break;
    }
  };

  // Kullanıcı bilgilerini kaydet
  const saveUserInfo = async () => {
    setIsLoading(true);
    try {
      // Kullanıcı bilgilerini güncelle
      const { success, error } = await updateProfile({
        userInfo: {
          height: userInfo.height,
          weight: userInfo.weight,
          activityLevel: userInfo.activityLevel,
          interests: userInfo.interests,
        },
      });

      if (!success) {
        console.error('Kullanıcı bilgileri güncellenirken hata:', error);
        // Hata durumunda son adıma geri dön
        setCurrentStep(Step.INTERESTS);
        return;
      }

      // Onboarding'i tamamla
      const onboardingResult = await completeOnboarding();
      if (!onboardingResult.success) {
        console.error('Onboarding tamamlanırken hata:', onboardingResult.error);
      }

      // Kullanıcıyı ana sayfaya yönlendir
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Bilgi kaydetme hatası:', error);
      setCurrentStep(Step.INTERESTS);
    } finally {
      setIsLoading(false);
    }
  };

  // İlgi alanı etiketlerini işle
  const toggleInterest = (id: string) => {
    setUserInfo(prev => {
      const interests = [...prev.interests];
      const index = interests.indexOf(id);
      
      if (index === -1) {
        interests.push(id);
      } else {
        interests.splice(index, 1);
      }
      
      return { ...prev, interests };
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => currentStep > 0 ? setCurrentStep(prev => prev - 1) : router.back()}
        >
          <Feather name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Bilgilerinizi Tamamlayın</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Boy ve Kilo bilgisi */}
          {currentStep === Step.HEIGHT_WEIGHT && (
            <Animated.View 
              style={styles.stepContainer}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Boy ve Kilo Bilgileri</Text>
                <Text style={styles.sectionDescription}>
                  Kişiselleştirilmiş deneyim için boy ve kilonuzu paylaşın
                </Text>
              </View>
              
              {/* Boy */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Boy (cm)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="170"
                    keyboardType="numeric"
                    value={userInfo.height}
                    onChangeText={(text) => setUserInfo({ ...userInfo, height: text })}
                  />
                </View>
                {errors.height && (
                  <Text style={styles.errorText}>{errors.height}</Text>
                )}
              </View>

              {/* Kilo */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kilo (kg)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="70"
                    keyboardType="numeric"
                    value={userInfo.weight}
                    onChangeText={(text) => setUserInfo({ ...userInfo, weight: text })}
                  />
                </View>
                {errors.weight && (
                  <Text style={styles.errorText}>{errors.weight}</Text>
                )}
              </View>
            </Animated.View>
          )}

          {/* Aktivite Seviyesi */}
          {currentStep === Step.ACTIVITY_LEVEL && (
            <Animated.View 
              style={styles.stepContainer}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Aktivite Seviyeniz</Text>
                <Text style={styles.sectionDescription}>
                  Günlük aktivite seviyenizi seçin
                </Text>
              </View>
              
              <View style={styles.optionsContainer}>
                {activityLevels.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.optionButton,
                      userInfo.activityLevel === level.id && styles.optionButtonActive
                    ]}
                    onPress={() => setUserInfo({ ...userInfo, activityLevel: level.id })}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        userInfo.activityLevel === level.id && styles.optionTextActive
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {errors.activityLevel && (
                <Text style={styles.errorText}>{errors.activityLevel}</Text>
              )}
            </Animated.View>
          )}

          {/* İlgi Alanları */}
          {currentStep === Step.INTERESTS && (
            <Animated.View 
              style={styles.stepContainer}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>İlgi Alanlarınız</Text>
                <Text style={styles.sectionDescription}>
                  İlgi alanlarınızı seçin (birden fazla seçebilirsiniz)
                </Text>
              </View>
              
              <View style={styles.tagsContainer}>
                {interestTags.map((tag) => {
                  const isSelected = userInfo.interests.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagButton,
                        isSelected && styles.tagButtonActive
                      ]}
                      onPress={() => toggleInterest(tag.id)}
                    >
                      <Text 
                        style={[
                          styles.tagText,
                          isSelected && styles.tagTextActive
                        ]}
                      >
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {errors.interests && (
                <Text style={styles.errorText}>{errors.interests}</Text>
              )}
            </Animated.View>
          )}

          {/* Yükleniyor */}
          {currentStep === Step.SAVING && (
            <Animated.View 
              style={styles.loadingContainer}
              entering={FadeIn.duration(300)}
            >
              <ActivityIndicator size="large" color="#FF5A5A" />
              <Text style={styles.loadingText}>Bilgileriniz kaydediliyor...</Text>
            </Animated.View>
          )}
          
          {/* İlerleme Butonu */}
          {currentStep !== Step.SAVING && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === Step.INTERESTS ? 'Tamamla' : 'Devam Et'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111111',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 24,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    color: '#111111',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  optionButtonActive: {
    borderColor: '#FF5A5A',
    backgroundColor: 'rgba(255, 90, 90, 0.1)',
  },
  optionText: {
    fontSize: 16,
    color: '#4B5563',
  },
  optionTextActive: {
    color: '#FF5A5A',
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tagButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
  },
  tagButtonActive: {
    borderColor: '#FF5A5A',
    backgroundColor: 'rgba(255, 90, 90, 0.1)',
  },
  tagText: {
    fontSize: 14,
    color: '#4B5563',
  },
  tagTextActive: {
    color: '#FF5A5A',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
  buttonContainer: {
    padding: 24,
    marginTop: 'auto',
  },
  nextButton: {
    backgroundColor: '#FF5A5A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 