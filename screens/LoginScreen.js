import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen({ navigation }) {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

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
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { success, error } = await signIn(formData.email, formData.password);

      if (success) {
        // Başarılı girişten sonra artık otomatik olarak yönlendirilecek,
        // AuthContext içindeki onAuthStateChange olay dinleyicisi tarafından
        // burada bir şey yapmaya gerek yok
      } else {
        setErrors({ general: error || t('errors.login') });
      }
    } catch (error) {
      setErrors({ general: t('errors.login') });
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
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
              <Text style={styles.title}>{t('auth.login')}</Text>
              <Text style={styles.subtitle}>{t('welcome.loginSubtitle')}</Text>
            </View>

            <View style={styles.card}>
              {errors.general && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={[styles.inputGroup, errors.email && styles.inputGroupError]}> 
                <MaterialIcons name="email" size={20} color={errors.email ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.email && styles.inputError, { flex: 1, backgroundColor: 'transparent' }]}
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
                  style={[styles.input, errors.password && styles.inputError, { flex: 1, backgroundColor: 'transparent' }]}
                  placeholder={t('auth.password')}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeIcon}>
                  <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.inputErrorText}>{errors.password}</Text>}

              {/* Continue Button */}
              <Button
                title={t('auth.login')}
                onPress={handleLogin}
                isLoading={isLoading}
                fullWidth
                style={[styles.continueButton, { backgroundColor: '#FF6B00' }]}
              />

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

              {/* Sign up link */}
              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>{t('auth.noAccount')} </Text>
                <TouchableOpacity onPress={goToRegister}>
                  <Text style={[styles.signUpText, { color: '#FF6B00' }]}>{t('auth.register')}</Text>
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
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    paddingHorizontal: 8,
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
    backgroundColor: 'transparent',
    borderWidth: 0,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  inputError: {
    color: '#EF4444',
  },
  inputErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  eyeIcon: {
    padding: 8,
  },
  continueButton: {
    marginTop: 16,
    marginBottom: 8,
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
  signUpText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
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
}); 