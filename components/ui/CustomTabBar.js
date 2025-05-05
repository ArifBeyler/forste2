import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Tamamen yeni tasarım ve yaklaşım
export default function CustomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(0);
  
  // Rota isimlerini ve ikonlarını tanımla
  const tabs = [
    { route: '/(tabs)', label: 'Ana Sayfa', icon: 'home' },
    { route: '/(tabs)/calendar', label: 'Takvim', icon: 'calendar' },
    { route: '/(tabs)/ai-chat', label: 'AI Chat', icon: 'chatbubble' },
    { route: '/(tabs)/focus', label: 'Focus', icon: 'timer-outline' },
    { route: '/(tabs)/profile', label: 'Profil', icon: 'person' },
  ];

  // Current path'i kontrol et
  useEffect(() => {
    console.log("Current pathname:", pathname);
    if (pathname?.includes('/(tabs)')) {
      if (pathname === '/(tabs)' || pathname === '/(tabs)/') setActiveTab(0);
      else if (pathname.includes('/calendar')) setActiveTab(1);
      else if (pathname.includes('/ai-chat')) setActiveTab(2);
      else if (pathname.includes('/focus')) setActiveTab(3);
      else if (pathname.includes('/profile')) setActiveTab(4);
    }
  }, [pathname]);

  // Tab'a tıklandığında
  const handleTabPress = (route, index) => {
    setActiveTab(index);
    router.push(route);
  };

  return (
    <View 
      style={[
        styles.container, 
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
        Platform.OS === 'web' ? { position: 'fixed' } : {},
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.content} pointerEvents="box-yes">
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          return (
            <TouchableOpacity 
              key={tab.route}
              style={[
                styles.tabButton,
                isActive && styles.activeTabButton
              ]} 
              onPress={() => handleTabPress(tab.route, index)}
              activeOpacity={0.6}
            >
              <View style={styles.tabContent}>
                <View style={[
                  styles.iconContainer,
                  isActive && styles.activeIconContainer
                ]}>
                  <Ionicons 
                    name={tab.icon} 
                    size={22} 
                    color={isActive ? '#FFFFFF' : '#555555'} 
                  />
                </View>
                <Text style={[
                  styles.tabLabel,
                  isActive && styles.activeTabLabel
                ]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    zIndex: 9999999,
    elevation: 9999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: '#FF5A5A',
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 90, 90, 0.1)',
  },
  tabLabel: {
    fontSize: 10,
    color: '#555555',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#FF5A5A',
    fontWeight: 'bold',
  }
}); 