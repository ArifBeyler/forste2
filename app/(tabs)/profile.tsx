import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
  };

  function handleNavigatePrivacy() {
    router.push('/privacy');
  }
  function handleNavigateSupport() {
    router.push('/support');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {t('profile.title')}
          </Text>
        </View>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer} accessibilityLabel={user?.user_metadata?.name || 'Kullanıcı'}>
            <Text style={styles.avatarText}>
              {user?.user_metadata?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.user_metadata?.name || t('profile.title')}</Text>
            <Text style={styles.userEmail}>{user?.email || 'kullanici@ornek.com'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Ionicons name="language-outline" size={20} color="#666" style={{ marginRight: 8 }} />
          <Text style={{ marginRight: 8 }}>{t('Dil')}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Türkçe"
            style={{ marginRight: 8, padding: 6, borderRadius: 6, backgroundColor: language === 'tr' ? '#FEE2E2' : '#F3F4F6' }}
            onPress={() => setLanguage('tr')}
          >
            <Text style={{ color: language === 'tr' ? '#DC2626' : '#333' }}>TR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="İngilizce"
            style={{ padding: 6, borderRadius: 6, backgroundColor: language === 'en' ? '#FEE2E2' : '#F3F4F6' }}
            onPress={() => setLanguage('en')}
          >
            <Text style={{ color: language === 'en' ? '#DC2626' : '#333' }}>EN</Text>
          </TouchableOpacity>
        </View>
        <View style={{ gap: 8 }}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleNavigatePrivacy}
            accessibilityRole="button"
            accessibilityLabel={t('Gizlilik ve Güvenlik')}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color="#666" style={{ marginRight: 12 }} />
            <Text style={styles.menuButtonText}>{t('Gizlilik ve Güvenlik')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleNavigateSupport}
            accessibilityRole="button"
            accessibilityLabel={t('Yardım ve Destek')}
          >
            <Ionicons name="help-circle-outline" size={22} color="#666" style={{ marginRight: 12 }} />
            <Text style={styles.menuButtonText}>{t('Yardım ve Destek')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
            accessibilityRole="button"
            accessibilityLabel={t('auth.logout')}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  headerContainer: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 30,
    color: '#666666',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  userEmail: {
    color: '#666666',
  },
  footer: {
    marginTop: 'auto',
  },
  logoutButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: '500',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  menuButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
}); 