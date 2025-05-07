import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';

export default function SupportScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  function handleContact() {
    Linking.openURL('mailto:support@forste.app');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('Geri')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Yardım ve Destek')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('Yardım ve Destek')}</Text>
        <Text style={styles.text}>{t('support.description') || 'Her türlü soru, öneri veya sorun için bize ulaşabilirsiniz.'}</Text>
        <TouchableOpacity style={styles.contactButton} onPress={handleContact} accessibilityRole="button" accessibilityLabel={t('support.contact')}>
          <Ionicons name="mail-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.contactButtonText}>{t('support.contact') || 'Destek ile İletişime Geç'}</Text>
        </TouchableOpacity>
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
  text: { fontSize: 15, color: '#444', marginBottom: 18 },
  contactButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF5A5A', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'flex-start' },
  contactButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
}); 