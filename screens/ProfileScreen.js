import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Renk Paleti
const COLORS = {
  primary: '#ff6b6b',
  background: '#f8f9fa',
  text: '#343a40',
  textLight: '#6c757d',
  border: '#dee2e6',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [langModalVisible, setLangModalVisible] = React.useState(false);
  
  // Çıkış işlemi
  const handleSignOut = () => {
    signOut();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLangModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Dil seçici"
        >
          <Ionicons name="language-outline" size={18} color="#666" style={{ marginRight: 4 }} />
          <Text style={{ color: '#333', fontWeight: 'bold' }}>{language === 'tr' ? 'TR' : 'EN'}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
      
      {/* Dil seçici modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity style={styles.langModalOverlay} activeOpacity={1} onPress={() => setLangModalVisible(false)}>
          <View style={styles.langModalContent}>
            <TouchableOpacity
              style={[styles.langOption, language === 'tr' && styles.langOptionActive]}
              onPress={() => { setLanguage('tr'); setLangModalVisible(false); }}
              accessibilityRole="button"
              accessibilityLabel="Türkçe"
            >
              <Text style={[styles.langOptionText, language === 'tr' && styles.langOptionTextActive]}>Türkçe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langOption, language === 'en' && styles.langOptionActive]}
              onPress={() => { setLanguage('en'); setLangModalVisible(false); }}
              accessibilityRole="button"
              accessibilityLabel="İngilizce"
            >
              <Text style={[styles.langOptionText, language === 'en' && styles.langOptionTextActive]}>English</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userName}>
          {user?.user_metadata?.name || 'Kullanıcı'}
        </Text>
        <Text style={styles.userEmail}>
          {user?.email || 'kullanici@email.com'}
        </Text>
      </View>
      
      <View style={styles.menuContainer}>
        {/* <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuText}>Ayarlar</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuText}>Gizlilik ve Güvenlik</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuText}>Yardım ve Destek</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
        <Text style={styles.signOutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  langModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 160,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  langOption: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginBottom: 2,
  },
  langOptionActive: {
    backgroundColor: '#FEE2E2',
  },
  langOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  langOptionTextActive: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    marginVertical: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  menuContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 10,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 10,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 20,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: 8,
  },
}); 