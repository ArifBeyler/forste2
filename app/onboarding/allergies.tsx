import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

// Alerji seçenekleri
const ALLERGIES = [
  { id: 'gluten', label: 'Gluten', icon: 'food-croissant' },
  { id: 'dairy', label: 'Süt / Süt Ürünleri', icon: 'cup' },
  { id: 'eggs', label: 'Yumurta', icon: 'egg' },
  { id: 'nuts', label: 'Kuruyemişler', icon: 'peanut' },
  { id: 'peanuts', label: 'Yer Fıstığı', icon: 'food' },
  { id: 'shellfish', label: 'Deniz Ürünleri', icon: 'fish' },
  { id: 'soy', label: 'Soya', icon: 'soy-sauce' },
  { id: 'wheat', label: 'Buğday', icon: 'barley' },
  { id: 'fruits', label: 'Meyve', icon: 'food-apple' },
  { id: 'mushroom', label: 'Mantar', icon: 'mushroom' },
  { id: 'coconut', label: 'Hindistan Cevizi', icon: 'food-apple-outline' },
  { id: 'almond', label: 'Badem', icon: 'seed-outline' },
];

// Beslenme tercihleri
const DIET_PREFERENCES = [
  { id: 'regular', label: 'Normal Beslenme', icon: 'silverware-fork-knife' },
  { id: 'vegetarian', label: 'Vejetaryen', icon: 'leaf' },
  { id: 'vegan', label: 'Vegan', icon: 'sprout' },
  { id: 'pescatarian', label: 'Pesketaryen', icon: 'fish' },
  { id: 'keto', label: 'Ketojenik', icon: 'food-steak' },
  { id: 'lowCarb', label: 'Düşük Karbonhidrat', icon: 'food-drumstick' },
];

export default function AllergiesScreen({ navigation }: { navigation?: any }) {
  const { updateProfile, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    allergies: [],
    dietPreference: 'regular',
  });
  const [error, setError] = useState('');

  // Form doğrulama fonksiyonu
  const validateForm = (): boolean => {
    // Bu formda dietPreference zaten default olarak 'regular' seçili
    // ve allergies seçimi isteğe bağlı olduğu için form her zaman geçerli
    return true;
  };

  const toggleAllergy = (allergyId: string) => {
    // "Alerjim Yok" seçilirse, diğer tüm alerjileri temizle
    if (allergyId === 'none') {
      if (formData.allergies.includes('none')) {
        // "Alerjim Yok" seçiliyse ve tekrar tıklanırsa, temizle
        setFormData({
          ...formData,
          allergies: [],
        });
      } else {
        // "Alerjim Yok" seçildiyse, sadece bu seçeneği aktifte tut
        setFormData({
          ...formData,
          allergies: ['none'],
        });
      }
      return;
    }

    // Başka bir alerji seçilirse, "Alerjim Yok" seçeneğini kaldır
    let newAllergies = [...formData.allergies];
    if (newAllergies.includes('none')) {
      newAllergies = newAllergies.filter(id => id !== 'none');
    }

    // Seçilen alerjiyi ekle veya çıkar
    if (newAllergies.includes(allergyId)) {
      newAllergies = newAllergies.filter(id => id !== allergyId);
    } else {
      newAllergies.push(allergyId);
    }

    setFormData({
      ...formData,
      allergies: newAllergies,
    });
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    
    // Eğer zaten yükleme durumundaysa, işlemi tekrarlamayı önle
    if (isLoading) return;

    setIsLoading(true);
    setError(''); // Hata mesajını temizle
    
    try {
      // Alerji bilgilerini güncelle
      const { success, error } = await updateProfile({
        userInfo: {
          allergies: formData.allergies,
          dietPreference: formData.dietPreference,
        }
      });
      
      if (success) {
        // Kullanıcı bilgilerini güncelledikten sonra yenile
        await refreshUser(1);
        
        // Bir sonraki ekrana geç
        navigation.navigate('Hydration');
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
          <Text style={styles.stepText}>Adım 3/4</Text>
          <Text style={styles.title}>Alerji ve Gıda Tercihleri</Text>
          <Text style={styles.subtitle}>
            Sağlığınız için alerji durumunuzu ve beslenme tercihlerinizi öğrenmemiz önemli
          </Text>
        </View>

        <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.card}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Alerjiler */}
          <Animated.View entering={SlideInRight.delay(400).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Gıda Alerjileriniz</Text>
            <Text style={styles.sectionSubtitle}>
              Varsa, birden fazla seçebilirsiniz
            </Text>
            <View style={styles.allergiesGrid}>
              {ALLERGIES.map((allergy) => (
                <TouchableOpacity
                  key={allergy.id}
                  style={[
                    styles.allergyItem,
                    formData.allergies.includes(allergy.id) && styles.allergyItemActive,
                  ]}
                  onPress={() => toggleAllergy(allergy.id)}
                >
                  <MaterialCommunityIcons
                    name={allergy.icon}
                    size={22}
                    color={formData.allergies.includes(allergy.id) ? '#FFF' : '#4B5563'}
                  />
                  <Text
                    style={[
                      styles.allergyLabel,
                      formData.allergies.includes(allergy.id) && styles.allergyLabelActive,
                    ]}
                  >
                    {allergy.label}
                  </Text>
                  {formData.allergies.includes(allergy.id) && (
                    <View style={styles.checkCircle}>
                      <Feather name="check" size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              
              {/* "Alerjim Yok" Butonu */}
              <TouchableOpacity
                style={[
                  styles.noAllergyItem,
                  formData.allergies.includes('none') && styles.allergyItemActive,
                ]}
                onPress={() => toggleAllergy('none')}
              >
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={22}
                  color={formData.allergies.includes('none') ? '#FFF' : '#4B5563'}
                />
                <Text
                  style={[
                    styles.allergyLabel,
                    formData.allergies.includes('none') && styles.allergyLabelActive,
                  ]}
                >
                  Alerjim Yok
                </Text>
                {formData.allergies.includes('none') && (
                  <View style={styles.checkCircle}>
                    <Feather name="check" size={14} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Beslenme Tercihi */}
          <Animated.View entering={SlideInRight.delay(500).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Beslenme Tercihiniz</Text>
            <View style={styles.dietPreferencesGrid}>
              {DIET_PREFERENCES.map((diet) => (
                <TouchableOpacity
                  key={diet.id}
                  style={[
                    styles.dietItem,
                    formData.dietPreference === diet.id && styles.dietItemActive,
                  ]}
                  onPress={() => setFormData({ ...formData, dietPreference: diet.id })}
                >
                  <MaterialCommunityIcons
                    name={diet.icon}
                    size={24}
                    color={formData.dietPreference === diet.id ? '#FFF' : '#4B5563'}
                  />
                  <Text
                    style={[
                      styles.dietLabel,
                      formData.dietPreference === diet.id && styles.dietLabelActive,
                    ]}
                  >
                    {diet.label}
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
  allergiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  allergyItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  noAllergyItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  allergyItemActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  allergyLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 10,
  },
  allergyLabelActive: {
    color: '#FFFFFF',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietPreferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dietItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  dietItemActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  dietLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 10,
  },
  dietLabelActive: {
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