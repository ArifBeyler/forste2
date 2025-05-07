import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalendarScreen from '../screens/CalendarScreen';
import ChatScreen from '../screens/ChatScreen';
import FocusScreen from '../screens/FocusScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function HomeTabNavigator() {
  // SafeArea insets değerlerini al
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // Etiketleri kaldır
        tabBarStyle: {
          ...styles.tabBar,
          height: 70 + (insets.bottom > 0 ? insets.bottom : 5), // İkon boyutları için yüksekliği arttır
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
        },
        tabBarActiveTintColor: '#FF5A5A',
        tabBarInactiveTintColor: '#555555',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Focus') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={styles.iconWrapper}>
              {focused && <View style={styles.activeIndicator} />}
              <View style={[
                styles.iconContainer,
                focused && styles.activeIconContainer
              ]}>
                <Ionicons name={iconName} size={24} color={focused ? '#FFFFFF' : '#555555'} />
              </View>
              {route.name === 'Focus' && (
                <Text style={{
                  fontSize: 10,
                  marginTop: 2,
                  color: focused ? '#FF5A5A' : '#555555'
                }}>Focus</Text>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen} 
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
      />
      <Tab.Screen 
        name="Focus" 
        component={FocusScreen}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 10,
    borderTopWidth: 0, // Üst çizgiyi kaldır
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    borderTopLeftRadius: 20, // Köşeleri yuvarlat
    borderTopRightRadius: 20,
  },
  iconWrapper: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    backgroundColor: '#FF5A5A',
    borderRadius: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#FF5A5A',
    shadowColor: '#FF5A5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
}); 