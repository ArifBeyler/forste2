import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// Ekran genişliğini al
const { width } = Dimensions.get('window');

// Renk Paleti - Yeni tema renklerine göre güncelledim
const COLORS = {
  primary: '#7E57C2', // Mor (Yeni görseldeki gibi)
  secondary: '#FFFFFF', // Beyaz
  background: '#F8FAFE', // Açık gri
  inactive: '#9CA3AF', // Gri
  activeHighlight: '#FFF8E1', // Ana sayfa aktif arka plan
  fabBlue: '#3B82F6', // Mavi - Takvim
  fabRed: '#E57373', // Kırmızı - Yapılacak
  fabGreen: '#4CAF50', // Yeşil - Sohbet
};

const BottomTabBar = ({ state, descriptors, navigation }) => {
  // Active tab için animasyon değeri
  const activeTabPosition = useSharedValue(0);
  
  // FAB menü için state
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  
  // İkon değişimi için animasyon değeri
  const iconAnimation = useRef(new Animated.Value(0)).current;
  
  // FAB animasyonları
  const animation = React.useRef(new Animated.Value(0)).current;
  const todoButtonAnimation = React.useRef(new Animated.Value(0)).current;
  const eventButtonAnimation = React.useRef(new Animated.Value(0)).current;
  const chatButtonAnimation = React.useRef(new Animated.Value(0)).current;
  
  // İkon değişim animasyonu
  useEffect(() => {
    // Takvim ekranına geçiş yapıldıysa
    if (state.index === 1) {
      // İkon animasyonunu başlat
      Animated.timing(iconAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Diğer ekranlara geçiş yapıldıysa animasyonu tersine çevir
      Animated.timing(iconAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [state.index]);
  
  // İkon opaklık değerleri
  const chatIconOpacity = iconAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  
  const addIconOpacity = iconAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  // FAB açma/kapama animasyonu
  const toggleFabMenu = () => {
    // Eğer aktif ekran Calendar değilse normal Chat sayfasına git
    if (state.index !== 1) {
      navigation.navigate('Chat');
      return;
    }
    
    const toValue = fabMenuOpen ? 0 : 1;
    
    // Ana buton rotasyonu
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Görev butonu animasyonu
    Animated.timing(todoButtonAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Etkinlik butonu animasyonu
    Animated.timing(eventButtonAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Chat butonu animasyonu
    Animated.timing(chatButtonAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setFabMenuOpen(!fabMenuOpen);
  };
  
  // Rotasyon animasyonu
  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });
  
  // Yapılacak butonu pozisyon animasyonu
  const todoButtonY = todoButtonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });
  
  // Etkinlik butonu pozisyon animasyonu
  const eventButtonY = eventButtonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });
  
  // Chat butonu pozisyon animasyonu
  const chatButtonY = chatButtonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -210],
  });
  
  // Opaklık animasyonu
  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  
  // FAB menüsü açıkken arka plan kapatıldığında menüyü kapat
  const closeFabMenu = () => {
    if (fabMenuOpen) {
      toggleFabMenu();
    }
  };
  
  // Sayfa değiştiğinde FAB menüsünü kapat
  useEffect(() => {
    if (fabMenuOpen) {
      toggleFabMenu();
    }
  }, [state.index]);

  // Tab butonlarının genişlik ve aralık hesaplamaları
  const TAB_COUNT = state.routes.length;
  const TAB_WIDTH = (width - 80) / TAB_COUNT; // Kenarları hesaplarken daha fazla kenar boşluğu veriyoruz
  
  // Tab pozisyonunu güncelle
  React.useEffect(() => {
    // Aktif tab indeksini alarak pozisyonu hesapla
    const activeTabIndex = state.index;
    activeTabPosition.value = withSpring(activeTabIndex * TAB_WIDTH, {
      damping: 15,
      stiffness: 120,
    });
  }, [state.index]);

  // Aktif tab için aktif indikatör stili
  const activeIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: activeTabPosition.value }],
    };
  });
  
  // Orta buton ikonu - Takvim ekranındayken + ikonu, diğer sayfalarda chat ikonu
  const centerButtonColor = state.index === 1 ? COLORS.fabBlue : COLORS.primary;

  return (
    <View style={styles.containerWrapper}>
      {/* FAB menüsü arka plan kapatma */}
      {fabMenuOpen && (
        <TouchableOpacity 
          style={styles.fabOverlay} 
          activeOpacity={1}
          onPress={closeFabMenu}
        />
      )}
      
      {/* Yapılacak Ekle Butonu */}
      <Animated.View 
        style={[
          styles.fabSecondary,
          {
            transform: [{ translateY: todoButtonY }],
            opacity: opacity
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.fabButtonSecondary, {backgroundColor: COLORS.fabRed}]} 
          onPress={() => {
            closeFabMenu();
            navigation.navigate('AddTask');
          }}
        >
          <Ionicons name="checkbox-outline" size={20} color="#FFFFFF" style={{marginRight: 8}} />
          <Animated.Text style={styles.fabButtonText}>Yapılacak</Animated.Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Etkinlik Ekle Butonu */}
      <Animated.View 
        style={[
          styles.fabSecondary,
          {
            transform: [{ translateY: eventButtonY }],
            opacity: opacity
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.fabButtonSecondary, {backgroundColor: COLORS.fabBlue}]} 
          onPress={() => {
            closeFabMenu();
            navigation.navigate('Calendar', { 
              screen: 'AddEvent' 
            });
          }}
        >
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" style={{marginRight: 8}} />
          <Animated.Text style={styles.fabButtonText}>Etkinlik</Animated.Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* AI Chat Butonu */}
      <Animated.View 
        style={[
          styles.fabSecondary,
          {
            transform: [{ translateY: chatButtonY }],
            opacity: opacity
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.fabButtonSecondary, {backgroundColor: COLORS.fabGreen}]} 
          onPress={() => {
            closeFabMenu();
            navigation.navigate('Chat');
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" style={{marginRight: 8}} />
          <Animated.Text style={styles.fabButtonText}>AI Chat</Animated.Text>
        </TouchableOpacity>
      </Animated.View>
      
      <View style={styles.container}>
        {/* Ortadaki büyük mor buton - Takvim sayfasında + butonu, diğer sayfalarda AI Chat butonu */}
        <View style={styles.centerButtonContainer}>
          <TouchableOpacity 
            style={[styles.centerButton, {backgroundColor: centerButtonColor}]}
            onPress={toggleFabMenu}
          >
            <Animated.View style={[
              styles.centerIconContainer,
              { opacity: chatIconOpacity }
            ]}>
              <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
            </Animated.View>
            
            <Animated.View style={[
              styles.centerIconContainer,
              { 
                opacity: addIconOpacity,
                transform: state.index === 1 ? [{ rotate: rotation }] : [{ rotate: '0deg' }]
              }
            ]}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Ana Sayfa - Sol başta */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Home')}
          style={[
            styles.tabButton, 
            { left: 25 },
            state.index === 0 && styles.activeTabButton
          ]}
        >
          <Ionicons
            name="home-outline"
            size={22}
            color={state.index === 0 ? '#FF9800' : COLORS.inactive}
          />
        </TouchableOpacity>

        {/* Takvim - Sol ortada */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Calendar')}
          style={[styles.tabButton, { left: 95 }]}
        >
          <Ionicons
            name="calendar-outline"
            size={22}
            color={state.index === 1 ? COLORS.primary : COLORS.inactive}
          />
        </TouchableOpacity>

        {/* Focus - Sağ ortada */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Focus')}
          style={[styles.tabButton, { right: 95 }]}
        >
          <Ionicons
            name="timer-outline"
            size={22}
            color={state.index === 3 ? COLORS.primary : COLORS.inactive}
          />
        </TouchableOpacity>

        {/* Profil - En sağda */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
          style={[styles.tabButton, { right: 25 }]}
        >
          <Ionicons
            name="person-outline"
            size={22}
            color={state.index === 4 ? COLORS.primary : COLORS.inactive}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    bottom: 20, // Alt kısımdan boşluk
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    height: 70,
    width: '90%', // Ekranın genişliğinin %90'ı
    marginHorizontal: 20,
    marginBottom: 0,
    borderRadius: 35, // Tam oval şekil
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5, // Daha fazla yükseklik
    },
    shadowOpacity: 0.2, // Daha belirgin gölge
    shadowRadius: 10, // Daha geniş gölge
    elevation: 10, // Android için daha belirgin gölge
  },
  tabButton: {
    height: 46,
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    position: 'absolute',
  },
  activeTabButton: {
    backgroundColor: COLORS.activeHighlight,
    borderRadius: 23,
    height: 46,
    width: 46,
  },
  centerButtonContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: -15, // Yukarı taşımak için negatif değer veriyoruz
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 3,
  },
  fabOverlay: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 90,
  },
  fabSecondary: {
    position: 'absolute',
    bottom: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  fabButtonSecondary: {
    width: 140,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  centerIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomTabBar; 