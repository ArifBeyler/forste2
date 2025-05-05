import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) => {
  
  // Button style based on props
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    disabled && styles.disabledButton,
    fullWidth && styles.fullWidthButton,
    style,
  ];

  // Text style based on props
  const textStyles = [
    styles.buttonText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    icon && styles.iconText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={buttonStyles}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? '#3B82F6' : '#ffffff'} />
      ) : (
        <>
          {icon && icon}
          <Text style={textStyles}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variant styles
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  
  // Size styles
  smButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mdButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  lgButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  
  // State styles
  disabledButton: {
    opacity: 0.5,
  },
  fullWidthButton: {
    width: '100%',
  },
  
  // Text styles
  buttonText: {
    fontWeight: '500',
  },
  
  // Text color based on variant
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#ffffff',
  },
  outlineText: {
    color: '#3B82F6',
  },
  ghostText: {
    color: '#3B82F6',
  },
  
  // Text size based on button size
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  
  // Icon spacing
  iconText: {
    marginLeft: 8,
  },
}); 