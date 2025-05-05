import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function Login() {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

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
        router.replace('/(tabs)');
      } else {
        setErrors({ general: error || t('errors.login') });
      }
    } catch (error) {
      setErrors({ general: t('errors.login') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Üst Başlık */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>
                Giriş Yap
              </Text>
              <Text style={styles.headerSubtitle}>
                Forste hesabına giriş yap
              </Text>
            </View>
            
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.formField}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="E-posta"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                />
              </View>
              {errors.email && (
                <Text style={styles.fieldError}>{errors.email}</Text>
              )}
            </View>

            {/* Şifre */}
            <View style={styles.formField}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.fieldError}>{errors.password}</Text>
              )}
            </View>

            {/* Giriş Yap Butonu */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'İşleniyor...' : 'Giriş Yap'}
              </Text>
            </TouchableOpacity>

            {/* Kayıt Ol bağlantısı */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Hesabın yok mu?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={styles.registerLink}>
                  Kayıt Ol
                </Text>
              </TouchableOpacity>
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
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  formField: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: '#1F2937',
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#6B7280',
  },
  registerLink: {
    color: '#F97316',
    fontWeight: '500',
  },
}); 