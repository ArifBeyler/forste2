import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';

export default function PrivacyScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('Geri')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Gizlilik ve Güvenlik')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('Gizlilik ve Güvenlik')}</Text>
        <Text style={styles.text}>{t('privacy.description') || 'Kişisel verileriniz gizli tutulur ve üçüncü şahıslarla paylaşılmaz. Hesabınız ve bilgileriniz güvenli bir şekilde saklanır.'}</Text>
        <Text style={styles.text}>{t('privacy.security') || 'Uygulama, güvenli iletişim ve veri şifreleme standartlarını uygular.'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#222' },
  text: { fontSize: 15, color: '#444', marginBottom: 12 },
}); 