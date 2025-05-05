import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

export default function LocationPermissionScreen({ navigation }: { navigation?: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const askForLocationPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // İzin verilsin veya verilmesin, bir sonraki ekrana geçiyoruz
      navigation?.navigate('MicrophonePermission');
    } catch (error) {
      console.error('Konum izni istenirken hata oluştu:', error);
      Alert.alert(
        "İzin Hatası",
        "Konum izni istenirken bir hata oluştu. Daha sonra tekrar deneyebilirsiniz."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const skipPermission = () => {
    // İzni atlayıp bir sonraki ekrana geçiyoruz
    navigation?.navigate('MicrophonePermission');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.stepText}>İzinler 2/3</Text>
        <Text style={styles.title}>Konum İzni</Text>
        <Text style={styles.subtitle}>
          Bulunduğunuz bölgeye özgü beslenme önerileri için konum bilgilerinize ihtiyacımız var. Bilgileriniz güvenle saklanacaktır.
        </Text>
      </View>

      <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.content}>
        <View style={styles.imageContainer}>
          <View style={styles.placeholderImage}>
            <MaterialIcons name="location-on" size={36} color="#3B82F6" />
          </View>
        </View>
        
        <Animated.View entering={SlideInRight.delay(400).duration(500)} style={styles.card}>
          <View style={styles.permissionItem}>
            <MaterialIcons name="near-me" size={24} color="#3B82F6" style={styles.icon} />
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Bölgesel Beslenme</Text>
              <Text style={styles.permissionDescription}>
                Yaşadığınız bölgeye özgü beslenme önerileri alın
              </Text>
            </View>
          </View>
          
          <View style={styles.permissionItem}>
            <MaterialIcons name="place" size={24} color="#3B82F6" style={styles.icon} />
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Yerel Gıda Önerileri</Text>
              <Text style={styles.permissionDescription}>
                Mevsiminde ve bölgenizde bulunan gıdaları keşfedin
              </Text>
            </View>
          </View>
          
          <View style={styles.permissionItem}>
            <MaterialIcons name="map" size={24} color="#3B82F6" style={styles.icon} />
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Yakındaki Etkinlikler</Text>
              <Text style={styles.permissionDescription}>
                Çevrenizdeki sağlık ve beslenme etkinliklerinden haberdar olun
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
          onPress={askForLocationPermission}
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
    backgroundColor: '#EFF6FF',
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