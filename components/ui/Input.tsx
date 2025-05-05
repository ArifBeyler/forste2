import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  labelStyle?: object;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  onRightIconPress?: () => void;
}

export const Input = ({
  label,
  error,
  helper,
  containerStyle,
  labelStyle,
  leftIcon,
  rightIcon,
  secureTextEntry,
  onRightIconPress,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  // Get border color based on state
  const getBorderStyle = () => {
    if (isFocused) return styles.focusedBorder;
    if (error) return styles.errorBorder;
    return styles.defaultBorder;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      <View
        style={[styles.inputContainer, getBorderStyle()]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {secureTextEntry ? (
          <TouchableOpacity 
            style={styles.rightButton} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Text style={styles.toggleText}>
              {isPasswordVisible ? 'Gizle' : 'Göster'}
            </Text>
          </TouchableOpacity>
        ) : rightIcon && onRightIconPress ? (
          <TouchableOpacity style={styles.rightIcon} onPress={onRightIconPress}>
            {rightIcon}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#4B5563',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  defaultBorder: {
    borderColor: '#F3F4F6',
  },
  focusedBorder: {
    borderColor: '#3B82F6',
  },
  errorBorder: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    color: '#1F2937',
    fontSize: 16,
    paddingVertical: 4,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  rightButton: {
    marginLeft: 8,
    padding: 4,
  },
  toggleText: {
    color: '#4B5563',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#4B5563',
    fontSize: 12,
    marginTop: 4,
  },
}); 