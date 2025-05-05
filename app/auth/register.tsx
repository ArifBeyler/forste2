import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface FormData {
  name: string;
  email: string;
  password: string;
  birthdate: Date;
  agreeToTerms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  birthdate?: string;
  general?: string;
}

// Ay isimleri
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

// Günleri oluştur (1-31)
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

// Yılları oluştur (bugünden 100 yıl öncesine kadar)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

export default function Register({ navigation }: { navigation?: any }) {
  const { t } = useLanguage();
  const { signUp, refreshUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    birthdate: new Date(new Date().setFullYear(new Date().getFullYear() - 18)), // Default 18 yaş
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Tarih bileşenleri için state'ler
  const [selectedDay, setSelectedDay] = useState(formData.birthdate.getDate().toString());
  const [selectedMonth, setSelectedMonth] = useState(formData.birthdate.getMonth());
  const [selectedYear, setSelectedYear] = useState(formData.birthdate.getFullYear().toString());

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // İsim kontrolü
    if (!formData.name.trim()) {
      newErrors.name = t('errors.required');
      isValid = false;
    }

    // E-posta kontrolü
    if (!formData.email) {
      newErrors.email = t('errors.required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
      isValid = false;
    }

    // Şifre kontrolü
    if (!formData.password) {
      newErrors.password = t('errors.required');
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = t('errors.passwordLength');
      isValid = false;
    }

    // Kullanım koşulları onayı
    if (!formData.agreeToTerms) {
      newErrors.general = t('errors.agreeToTerms');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { success, error } = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.birthdate.toISOString().split('T')[0]
      );

      if (success) {
        // Kullanıcı bilgilerini hemen güncelle
        await refreshUser();
        
        // Onboarding sürecine yönlendir
        if (navigation) {
          // Yeni bir stack başlatarak kayıt ekranına geri dönmeyi engelliyoruz
          navigation.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          });
        }
      } else {
        setErrors({ general: error || t('errors.register') });
      }
    } catch (error) {
      setErrors({ general: t('errors.register') });
    } finally {
      setIsLoading(false);
    }
  };

  const showDatePickerModal = () => {
    // Mevcut tarih değerlerini seçili değerlere ata
    setSelectedDay(formData.birthdate.getDate().toString());
    setSelectedMonth(formData.birthdate.getMonth());
    setSelectedYear(formData.birthdate.getFullYear().toString());
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    // Seçilen değerlerden tarih oluştur
    const newDate = new Date(
      parseInt(selectedYear),
      selectedMonth,
      parseInt(selectedDay)
    );
    
    // formData'yı güncelle
    setFormData({ ...formData, birthdate: newDate });
    setShowDatePicker(false);
  };

  const cancelDateSelection = () => {
    setShowDatePicker(false);
  };

  // Ayın kaç gün olduğunu hesapla
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Seçilen ay ve yıla göre geçerli günleri oluştur
  const getDaysArray = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, parseInt(selectedYear));
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  };

  // Seçilen gün geçersiz olduğunda düzelt
  const fixDaySelection = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, parseInt(selectedYear));
    if (parseInt(selectedDay) > daysInMonth) {
      setSelectedDay(daysInMonth.toString());
    }
  };

  // Giriş Yap bağlantısı
  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>
                Kayıt Ol
              </Text>
              <Text style={styles.subtitle}>
                Forste'ye Hoş Geldiniz!
              </Text>
            </View>
            
            <View style={styles.card}>
              {errors.general && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              )}

              {/* Ad Soyad */}
              <View style={styles.inputGroup}>
                <MaterialIcons name="person" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ad Soyad"
                  autoCapitalize="words"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.name && (
                <Text style={styles.inputErrorText}>{errors.name}</Text>
              )}

              {/* Email */}
              <View style={styles.inputGroup}>
                <MaterialIcons name="email" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.email && (
                <Text style={styles.inputErrorText}>{errors.email}</Text>
              )}

              {/* Şifre */}
              <View style={styles.inputGroup}>
                <Feather name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Şifre"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Feather 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.inputErrorText}>{errors.password}</Text>
              )}

              {/* Doğum Tarihi */}
              <View style={styles.inputGroup}>
                <Feather name="calendar" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TouchableOpacity 
                  onPress={showDatePickerModal}
                  style={styles.dateSelector}
                >
                  <Text style={styles.dateText}>
                    {formData.birthdate.getDate()}/{formData.birthdate.getMonth() + 1}/{formData.birthdate.getFullYear()}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Kullanım Koşulları Onayı */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={[styles.checkbox, formData.agreeToTerms ? styles.checkboxChecked : null]} 
                  onPress={() => setFormData({...formData, agreeToTerms: !formData.agreeToTerms})}
                >
                  {formData.agreeToTerms && <Feather name="check" size={16} color="#fff" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>
                  <Text>Kullanım koşullarını kabul ediyorum</Text>
                </Text>
              </View>
              {errors.general && (
                <Text style={styles.inputErrorText}>{errors.general}</Text>
              )}

              {/* Kayıt Ol Butonu */}
              <TouchableOpacity 
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.registerButtonText}>
                  {isLoading ? 'İşleniyor...' : 'Kayıt Ol'}
                </Text>
              </TouchableOpacity>
              
              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.divider} />
              </View>
              
              {/* Social Buttons */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialButton}>
                  <FontAwesome name="apple" size={22} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <FontAwesome name="google" size={22} color="#EA4335" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Feather name="x" size={22} color="#111" />
                </TouchableOpacity>
              </View>

              {/* Giriş Yap bağlantısı */}
              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>
                  Zaten hesabın var mı?{' '}
                </Text>
                <TouchableOpacity onPress={goToLogin}>
                  <Text style={styles.loginText}>
                    Giriş Yap
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Özel Tarih Seçici Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={() => {
          // Geri tuşuna basıldığında modalı kapatma
          // Boş bırakarak geri tuşunun modalı kapatmasını engelliyoruz
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Doğum Tarihi Seçin</Text>
            </View>
            
            {/* Tarih Seçici */}
            <View style={styles.pickerContainer}>
              {/* Gün Seçici */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Gün</Text>
                <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                  {getDaysArray().map(day => (
                    <TouchableOpacity 
                      key={day} 
                      style={[
                        styles.pickerItem,
                        selectedDay === day ? styles.pickerItemSelected : null
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text 
                        style={[
                          styles.pickerText,
                          selectedDay === day ? styles.pickerTextSelected : null
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Ay Seçici */}
              <View style={[styles.pickerColumn, { width: '40%' }]}>
                <Text style={styles.pickerLabel}>Ay</Text>
                <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((month, index) => (
                    <TouchableOpacity 
                      key={month} 
                      style={[
                        styles.pickerItem,
                        selectedMonth === index ? styles.pickerItemSelected : null
                      ]}
                      onPress={() => {
                        setSelectedMonth(index);
                        fixDaySelection();
                      }}
                    >
                      <Text 
                        style={[
                          styles.pickerText,
                          selectedMonth === index ? styles.pickerTextSelected : null
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Yıl Seçici */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Yıl</Text>
                <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                  {YEARS.map(year => (
                    <TouchableOpacity 
                      key={year} 
                      style={[
                        styles.pickerItem,
                        selectedYear === year ? styles.pickerItemSelected : null
                      ]}
                      onPress={() => {
                        setSelectedYear(year);
                        fixDaySelection();
                      }}
                    >
                      <Text 
                        style={[
                          styles.pickerText,
                          selectedYear === year ? styles.pickerTextSelected : null
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            {/* Butonlar */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.cancelButton]}
                onPress={cancelDateSelection}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.confirmButton]}
                onPress={confirmDate}
              >
                <Text style={styles.confirmButtonText}>Onayla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  errorContainer: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  inputErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  eyeIcon: {
    padding: 8,
  },
  dateSelector: {
    flex: 1,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  registerButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 14,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  bottomText: {
    color: '#4B5563',
    fontSize: 14,
  },
  loginText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContentCentered: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  pickerColumn: {
    width: '30%',
  },
  pickerLabel: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#6B7280',
    fontWeight: '500',
  },
  pickerScrollView: {
    height: 160,
  },
  pickerItem: {
    padding: 8,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#FFF1E6',
  },
  pickerText: {
    fontSize: 18,
    color: '#1F2937',
  },
  pickerTextSelected: {
    color: '#FF6B00',
    fontWeight: '500',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderRightWidth: 0.5,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  confirmButton: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
}); 