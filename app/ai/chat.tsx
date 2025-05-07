import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function AiChatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AI Chat Sohbet Ekranı</Text>
        <Text style={styles.description}>Buraya sohbet arayüzü gelecek</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666666',
  },
}); 