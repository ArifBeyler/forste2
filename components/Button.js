import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

export const Button = ({ 
  title,
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  variant = 'primary', // primary, secondary, outline, text
}) => {
  // Buton varyantlarına göre stil
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'text':
        return styles.textButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };

  // Buton metin stili
  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButtonText;
      case 'outline':
        return styles.outlineButtonText;
      case 'text':
        return styles.textButtonText;
      case 'primary':
      default:
        return styles.primaryButtonText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFF' : '#FF6B00'} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  secondaryButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  outlineButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 