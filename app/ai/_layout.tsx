import { Stack } from 'expo-router';
import React from 'react';

export default function AiLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat"
        options={{
          title: 'AI Chat Sohbet',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Geçmiş',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="image-generator"
        options={{
          title: 'Resim Üret',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="note"
        options={{
          title: 'Not Çıkart',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="dream"
        options={{
          title: 'Rüya Yorumlama',
          headerShown: true,
        }}
      />
    </Stack>
  );
} 