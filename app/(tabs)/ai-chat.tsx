import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function AiChatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Asistan</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.emptyState}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="chat" size={64} color="#FF5A5A" />
          </View>
          <Text style={styles.emptyTitle}>AI Asistanınız</Text>
          <Text style={styles.emptyText}>
            Beslenme, egzersiz, sağlık alışkanlıkları ve yaşam tarzı hakkında her türlü sorunuzu sorabilirsiniz.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    padding: 24,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF5A5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 