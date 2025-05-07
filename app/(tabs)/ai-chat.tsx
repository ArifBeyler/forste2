import { Redirect } from 'expo-router';
import React from 'react';

export default function AiChatRedirect() {
  // Otomatik olarak AI ana sayfasına yönlendir
  return <Redirect href="/ai" />;
} 