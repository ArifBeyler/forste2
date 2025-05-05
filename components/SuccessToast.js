import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const SuccessToast = ({ visible, message, onHide, type = 'success' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Toast'ı göster
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Belirli bir süre sonra gizle
      const timer = setTimeout(() => {
        hideToast();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  // Icon ve renk seçimi
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#4CAF50' };
      case 'error':
        return { icon: 'close-circle', color: '#F44336' };
      case 'warning':
        return { icon: 'warning', color: '#FF9800' };
      case 'info':
        return { icon: 'information-circle', color: '#2196F3' };
      default:
        return { icon: 'checkmark-circle', color: '#4CAF50' };
    }
  };

  const { icon, color } = getIconAndColor();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          backgroundColor: `${color}10`,
          borderLeftColor: color,
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={icon} size={24} color={color} style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  message: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  }
});

export default SuccessToast; 