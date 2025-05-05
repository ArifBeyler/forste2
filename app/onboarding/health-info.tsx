import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

// Cinsiyet seçenekleri
const GENDERS = [
  { id: 'male', label: 'Erkek', icon: 'male' },
  { id: 'female', label: 'Kadın', icon: 'female' },
  { id: 'other', label: 'Belirtmek İstemiyorum', icon: 'genderless' },
];

// Hedef seçenekleri
const GOALS = [
  { id: 'lose', label: 'Kilo Verme', icon: 'weight' },
  { id: 'maintain', label: 'Form Koruma', icon: 'scale-balance' },
  { id: 'gain', label: 'Kilo Alma', icon: 'food-apple' },
  { id: 'muscle', label: 'Kas Kazanımı', icon: 'arm-flex' },
];

export default function HealthInfoScreen({ navigation }: { navigation?: any }) {
  const { user, updateProfile, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    gender: '',
    goal: '',
    age: '',
  });
  const [errors, setErrors] = useState({
    height: '',
    weight: '',
    general: '',
  });

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

  const validateForm = (): boolean => {
    const newErrors = {
      height: '',
      weight: '',
      general: '',
    };
    let isValid = true;

    if (!formData.height.trim()) {
      newErrors.height = 'Boy bilgisi zorunludur';
      isValid = false;
    } else if (isNaN(Number(formData.height)) || Number(formData.height) < 120 || Number(formData.height) > 220) {
      newErrors.height = 'Geçerli bir boy giriniz (120-220 cm)';
      isValid = false;
    }

    if (!formData.weight.trim()) {
      newErrors.weight = 'Kilo bilgisi zorunludur';
      isValid = false;
    } else if (isNaN(Number(formData.weight)) || Number(formData.weight) < 30 || Number(formData.weight) > 200) {
      newErrors.weight = 'Geçerli bir kilo giriniz (30-200 kg)';
      isValid = false;
    }

    if (!formData.goal) {
      newErrors.general = 'Lütfen bir hedef seçin';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = async () => {
    try {
      // Sağlık bilgilerini güncelle
      const { success, error } = await updateProfile({
        userInfo: {
          height: formData.height,
          weight: formData.weight,
          gender: formData.gender,
          age: formData.age,
          goal: formData.goal,
        }
      });
      
      if (success) {
        // Bir sonraki ekrana geç
        navigation.navigate('Activity');
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.stepText}>Adım 1/4</Text>
            <Text style={styles.title}>Sağlık Bilgileri</Text>
            <Text style={styles.subtitle}>
              Size en uygun önerileri sunabilmemiz için lütfen sağlık bilgilerinizi paylaşın
            </Text>
          </View>

          <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.card}>
            {errors.general ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            ) : null}

            {/* Boy */}
            <Animated.View entering={SlideInRight.delay(400).duration(500)} style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Boy (cm)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="175"
                  value={formData.height}
                  onChangeText={(text) => setFormData({ ...formData, height: text })}
                />
                <Text style={styles.inputSuffix}>cm</Text>
              </View>
              {errors.height ? <Text style={styles.fieldError}>{errors.height}</Text> : null}
            </Animated.View>

            {/* Kilo */}
            <Animated.View entering={SlideInRight.delay(500).duration(500)} style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kilo (kg)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="70"
                  value={formData.weight}
                  onChangeText={(text) => setFormData({ ...formData, weight: text })}
                />
                <Text style={styles.inputSuffix}>kg</Text>
              </View>
              {errors.weight ? <Text style={styles.fieldError}>{errors.weight}</Text> : null}
            </Animated.View>

            {/* Hedef */}
            <Animated.View entering={SlideInRight.delay(600).duration(500)} style={styles.selectionContainer}>
              <Text style={styles.inputLabel}>Günlük Hedef</Text>
              <View style={styles.selectionGrid}>
                {GOALS.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.selectionItem,
                      formData.goal === goal.id && styles.selectionItemActive,
                    ]}
                    onPress={() => setFormData({ ...formData, goal: goal.id })}
                  >
                    <MaterialCommunityIcons
                      name={goal.icon}
                      size={24}
                      color={formData.goal === goal.id ? '#FFF' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.selectionText,
                        formData.goal === goal.id && styles.selectionTextActive,
                      ]}
                    >
                      {goal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Cinsiyet */}
            <Animated.View entering={SlideInRight.delay(700).duration(500)} style={styles.selectionContainer}>
              <Text style={[styles.inputLabel, { marginBottom: 6 }]}>Cinsiyet (Opsiyonel)</Text>
              <View style={styles.genderContainer}>
                {GENDERS.map((gender) => (
                  <TouchableOpacity
                    key={gender.id}
                    style={[
                      styles.genderItem,
                      formData.gender === gender.id && styles.genderItemActive,
                    ]}
                    onPress={() => setFormData({ ...formData, gender: gender.id })}
                  >
                    <FontAwesome5
                      name={gender.icon}
                      size={20}
                      color={formData.gender === gender.id ? '#FFF' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        formData.gender === gender.id && styles.genderTextActive,
                      ]}
                    >
                      {gender.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Yaş */}
            <Animated.View entering={SlideInRight.delay(800).duration(500)} style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yaş</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="25"
                  value={formData.age}
                  onChangeText={(text) => setFormData({ ...formData, age: text })}
                />
                <Text style={styles.inputSuffix}>yaş</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Button 
            title="Devam Et" 
            onPress={handleNext} 
            isLoading={isLoading}
            style={styles.continueButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  flex: {
    flex: 1,
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputSuffix: {
    fontSize: 16,
    color: '#6B7280',
    paddingRight: 16,
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  selectionContainer: {
    marginBottom: 20,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  selectionItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  selectionItemActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  selectionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 8,
  },
  selectionTextActive: {
    color: '#FFFFFF',
  },
  genderContainer: {
    flexDirection: 'column',
  },
  genderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  genderItemActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 12,
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 14,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
}); 