import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            {t('profile.title')}
          </Text>
        </View>
        
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.user_metadata?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.user_metadata?.name || 'Kullanıcı'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || 'kullanici@ornek.com'}
            </Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.logoutButtonText}>
              {t('auth.logout')}
            </Text>
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
}); 