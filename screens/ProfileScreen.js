import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

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
  
  // Çıkış işlemi
  const handleSignOut = () => {
    signOut();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <Text style={styles.headerSubtitle}>Hesap Bilgileriniz</Text>
      </View>
      
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
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuText}>Ayarlar</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
        
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
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