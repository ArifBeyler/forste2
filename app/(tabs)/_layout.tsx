import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function TabLayout() {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();

  // Tab layout yüklendiğinde kullanıcı bilgilerini güncelle
  useEffect(() => {
    const loadUserData = async () => {
      await refreshUser();
    };
    
    loadUserData();
  }, []);

  return (
    <View style={styles.container}>
      {/* Ana içerik */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Varsayılan tabBar'ı gizle (CustomTabBar kullanıyoruz)
          animation: 'none', // Yanıp sönme sorununu önlemek için animasyonları devre dışı bırak
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: t('tabs.home'),
            animation: 'none', // Tab animasyonunu kapat
          }} 
        />
        <Tabs.Screen 
          name="calendar" 
          options={{ 
            title: t('tabs.calendar'),
            animation: 'none', // Tab animasyonunu kapat
          }} 
        />
        <Tabs.Screen 
          name="ai-chat" 
          options={{ 
            title: 'AI Chat',
            animation: 'none', // Tab animasyonunu kapat
          }} 
        />
        <Tabs.Screen 
          name="focus" 
          options={{ 
            title: 'Focus',
            animation: 'none', // Tab animasyonunu kapat
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: t('tabs.profile'),
            animation: 'none', // Tab animasyonunu kapat
          }} 
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F7F8FA',
  },
});
