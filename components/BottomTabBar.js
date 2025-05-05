import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// Ekran genişliğini al
const { width } = Dimensions.get('window');

// Renk Paleti - Uygulamanın ana renklerine uygun olarak güncelledim
const COLORS = {
  primary: '#4F6AF0', // Mavi (ProjectScreen'deki primary renkle aynı)
  secondary: '#f8f9fa', // Beyaz
  background: '#F8FAFE', // Açık gri
  inactive: '#ced4da', // Gri
};

const BottomTabBar = ({ state, descriptors, navigation }) => {
  // Active tab için animasyon değeri
  const activeTabPosition = useSharedValue(0);

  // Tab butonlarının genişlik ve aralık hesaplamaları
  const TAB_COUNT = state.routes.length;
  const TAB_WIDTH = (width - 40) / TAB_COUNT; // Toplam genişlik - (Soldan 20px + Sağdan 20px) / Tab sayısı
  
  // Tab pozisyonunu güncelle
  React.useEffect(() => {
    // Aktif tab indeksini alarak pozisyonu hesapla
    const activeTabIndex = state.index;
    activeTabPosition.value = withSpring(activeTabIndex * TAB_WIDTH, {
      damping: 15,
      stiffness: 120,
    });
  }, [state.index]);

  // Aktif tab için hareketli background stili
  const activeTabStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: activeTabPosition.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Hareketli active tab background'ı */}
      <Animated.View style={[styles.activeBackground, { width: TAB_WIDTH }, activeTabStyle]} />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        // Tab ikonunu belirle
        let iconName;
        if (route.name === 'Home') {
          iconName = 'home-outline';
        } else if (route.name === 'Calendar') {
          iconName = 'calendar-outline';
        } else if (route.name === 'Chat') {
          iconName = 'chatbubble-ellipses-outline';
        } else if (route.name === 'Focus') {
          iconName = 'timer-outline';
        } else if (route.name === 'Profile') {
          iconName = 'person-outline';
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={onPress}
            style={[styles.tabButton, { width: TAB_WIDTH }]}
          >
            <Ionicons
              name={iconName}
              size={22}
              color={isFocused ? '#fff' : COLORS.inactive}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    height: 60,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 30,
    position: 'relative',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  activeBackground: {
    position: 'absolute',
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    top: 0,
    left: 0,
  },
  tabButton: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default BottomTabBar; 