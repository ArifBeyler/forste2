import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Renk Paleti
const COLORS = {
  primary: '#ff6b6b',
  background: '#f8f9fa',
  text: '#343a40',
  textLight: '#6c757d',
};

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <Text style={styles.headerSubtitle}>Tüm bildirimleriniz burada görünür</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.contentText}>Bildiriminiz bulunmamaktadır</Text>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentText: {
    fontSize: 16,
    color: COLORS.text,
  },
}); 