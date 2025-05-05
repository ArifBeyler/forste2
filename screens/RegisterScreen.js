import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterScreen({ navigation }) {
  const { t } = useLanguage();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.fullName) {
      newErrors.fullName = t('errors.required');
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = t('errors.required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = t('errors.required');
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = t('errors.passwordLength');
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.required');
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordMatch');
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
        formData.fullName,
        '' // Doğum tarihi için boş değer gönderiyoruz, daha sonra kullanıcı profilinden güncellenebilir
      );

      if (success) {
        // Başarılı kayıttan sonra artık otomatik olarak yönlendirilecek,
        // AuthContext içindeki onAuthStateChange olay dinleyicisi tarafından
        // burada bir şey yapmaya gerek yok
      } else {
        setErrors({ general: error || t('errors.registration') });
      }
    } catch (error) {
      setErrors({ general: t('errors.registration') });
    } finally {
      setIsLoading(false);
    }
  };

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
              <Text style={styles.title}>{t('auth.register')}</Text>
              <Text style={styles.subtitle}>{t('welcome.registerSubtitle')}</Text>
            </View>

            <View style={styles.card}>
              {errors.general && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              )}

              {/* Full Name Input */}
              <View style={[styles.inputGroup, errors.fullName && styles.inputGroupError]}>
                <MaterialIcons name="person" size={20} color={errors.fullName ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder={t('auth.fullName')}
                  autoCapitalize="words"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.fullName && <Text style={styles.inputErrorText}>{errors.fullName}</Text>}

              {/* Email Input */}
              <View style={[styles.inputGroup, errors.email && styles.inputGroupError]}>
                <MaterialIcons name="email" size={20} color={errors.email ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder={t('auth.email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.email && <Text style={styles.inputErrorText}>{errors.email}</Text>}

              {/* Password Input */}
              <View style={[styles.inputGroup, errors.password && styles.inputGroupError]}>
                <Feather name="lock" size={20} color={errors.password ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder={t('auth.password')}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeIcon}>
                  <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.inputErrorText}>{errors.password}</Text>}

              {/* Confirm Password Input */}
              <View style={[styles.inputGroup, errors.confirmPassword && styles.inputGroupError]}>
                <Feather name="lock" size={20} color={errors.confirmPassword ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder={t('auth.confirmPassword')}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeIcon}>
                  <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.inputErrorText}>{errors.confirmPassword}</Text>}

              {/* Register Button */}
              <Button
                title={t('auth.register')}
                onPress={handleRegister}
                isLoading={isLoading}
                fullWidth
                style={styles.continueButton}
              />

              {/* Terms and Privacy */}
              <Text style={styles.termsText}>
                {t('auth.termsPrefix')}{' '}
                <Text style={styles.termsLink}>{t('auth.terms')}</Text> {t('auth.and')}{' '}
                <Text style={styles.termsLink}>{t('auth.privacy')}</Text>
              </Text>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('auth.or')}</Text>
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

              {/* Login link */}
              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>{t('auth.haveAccount')} </Text>
                <TouchableOpacity onPress={goToLogin}>
                  <Text style={styles.signUpText}>{t('auth.login')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  inputGroupError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    color: '#EF4444',
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
  continueButton: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#FF6B00',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginVertical: 12,
  },
  termsLink: {
    color: '#FF6B00',
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
    justifyContent: 'center',
    marginBottom: 16,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signUpText: {
    color: '#FF6B00',
    fontWeight: '500',
    fontSize: 14,
  },
}); 