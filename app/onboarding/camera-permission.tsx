import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';

export default function CameraPermissionScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const askForCameraPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // İzin verilsin veya verilmesin, bir sonraki ekrana geçiyoruz
      navigation?.navigate('LocationPermission');
    } catch (error) {
      console.error('Kamera izni istenirken hata oluştu:', error);
      Alert.alert(
        "İzin Hatası",
        "Kamera izni istenirken bir hata oluştu. Daha sonra tekrar deneyebilirsiniz."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const skipPermission = () => {
    // İzni atlayıp bir sonraki ekrana geçiyoruz
    navigation?.navigate('LocationPermission');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.stepText}>İzinler 1/3</Text>
        <Text style={styles.title}>Kamera İzni</Text>
        <Text style={styles.subtitle}>
          Sağlıklı beslenme ve yaşam tarzınızı takip etmek için kamera erişimine ihtiyacımız var. Bu izin, profil fotoğrafı çekmenizi ve yemek takibi yapmanızı sağlar.
        </Text>
      </View>

      <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.content}>
        <View style={styles.imageContainer}>
          <View style={styles.placeholderImage}>
            <MaterialIcons name="camera-alt" size={36} color="#FF6B00" />
          </View>
        </View>
        
        <Animated.View entering={SlideInRight.delay(400).duration(500)} style={styles.card}>
          <View style={styles.permissionItem}>
            <MaterialIcons name="photo-camera" size={24} color="#FF6B00" style={styles.icon} />
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Profil Fotoğrafı</Text>
              <Text style={styles.permissionDescription}>
                Kişiselleştirilmiş bir profil oluşturun
              </Text>
            </View>
          </View>
          
          <View style={styles.permissionItem}>
            <MaterialIcons name="insert-photo" size={24} color="#FF6B00" style={styles.icon} />
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Yemek Fotoğrafları</Text>
              <Text style={styles.permissionDescription}>
                Tükettiğiniz yiyeceklerin fotoğraflarını çekerek takip edin
              </Text>
            </View>
          </View>
          
          <View style={styles.permissionItem}>
            <MaterialIcons name="camera" size={24} color="#FF6B00" style={styles.icon} />
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Besin Değeri Tarama</Text>
              <Text style={styles.permissionDescription}>
                Gıda etiketlerini tarayarak besin değerlerini öğrenin
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={skipPermission}
          disabled={isLoading}
        >
          <Text style={styles.skipButtonText}>Şimdi Değil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={askForCameraPermission}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'İşleniyor...' : 'İzin Ver'}
          </Text>
          {!isLoading && <MaterialIcons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    padding: 24,
    paddingBottom: 0,
  },
  stepText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  image: {
    width: 240,
    height: 240,
  },
  placeholderImage: {
    width: 180,
    height: 180,
    backgroundColor: '#FFF7ED',
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  permissionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  icon: {
    width: 32,
    alignItems: 'center',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  skipButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
}); 