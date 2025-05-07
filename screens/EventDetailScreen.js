import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SharedElement } from 'react-navigation-shared-element';

const { width, height } = Dimensions.get('window');

// Sıralı animasyon oluşturmak için yardımcı fonksiyon
const createAnimationSequence = (animations, duration = 250, delay = 50) => {
  return animations.map((anim, i) => Animated.timing(
    anim,
    {
      toValue: 1,
      duration: duration,
      delay: i * delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }
  ));
};

const EventDetailScreen = ({ route, navigation }) => {
  const { event, onDelete } = route.params;
  
  // Animasyon değerleri
  const headerAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const typeAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  
  // Her bölüm için ayrı animasyon değerleri
  const descriptionAnim = useRef(new Animated.Value(0)).current;
  const timeAnim = useRef(new Animated.Value(0)).current;
  const locationAnim = useRef(new Animated.Value(0)).current;
  const participantsAnim = useRef(new Animated.Value(0)).current;
  const reminderAnim = useRef(new Animated.Value(0)).current;
  const categoryAnim = useRef(new Animated.Value(0)).current;
  
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  
  // Animasyonları başlat
  useEffect(() => {
    // Tüm animasyonları sırayla başlat
    Animated.sequence([
      // 1. Header animasyonu
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      
      // 2. İkon, tür, başlık animasyonu
      Animated.parallel([
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(typeAnim, {
          toValue: 1,
          duration: 250,
          delay: 50,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 250,
          delay: 100,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]),
      
      // 3. Kart animasyonu
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      
      // 4. Kart içindeki bölümlerin animasyonu - sırayla
      Animated.stagger(70, [
        Animated.timing(descriptionAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        
        Animated.timing(timeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        
        ...(event.location ? [
          Animated.timing(locationAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          })
        ] : []),
        
        ...(event.participants && event.participants.length > 0 ? [
          Animated.timing(participantsAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          })
        ] : []),
        
        // Kategori animasyonu
        Animated.timing(categoryAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        
        ...(event.reminder ? [
          Animated.timing(reminderAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          })
        ] : []),
      ]),
      
      // 5. Butonlar animasyonu
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.elastic(1)),
      }),
    ]).start();
  }, []);
  
  // Etkinlik silme işlemini yapmak için dialog göster
  const handleDeleteEvent = () => {
    Alert.alert(
      "Etkinliği Sil",
      "Bu etkinliği silmek istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Sil",
          onPress: async () => {
            try {
              // Silme işlemi başlıyor bildirimi
              console.log("Etkinlik silme işlemi başlatılıyor, ID:", event.id);
              
              // onDelete fonksiyonu varsa çağır ve await ile bekle
              if (onDelete) {
                const result = await onDelete(event.id);
                
                if (result && result.success) {
                  console.log("Etkinlik başarıyla silindi");
                  // Başarılı silme işlemi sonrası geri dön
                  navigation.goBack();
                } else {
                  // Silme başarısız olduysa kullanıcıya bildir
                  const errorMsg = result?.error || "Etkinlik silinirken bir hata oluştu";
                  console.error("Etkinlik silme hatası:", errorMsg);
                  
                  Alert.alert(
                    "Silme Hatası",
                    errorMsg,
                    [{ text: "Tamam" }]
                  );
                }
              } else {
                console.error("onDelete fonksiyonu tanımlanmamış");
                Alert.alert(
                  "İşlem Hatası",
                  "Silme fonksiyonu tanımlanmamış. Lütfen daha sonra tekrar deneyin.",
                  [{ text: "Tamam" }]
                );
              }
            } catch (error) {
              console.error("Etkinlik silme işlemi sırasında beklenmeyen hata:", error);
              
              Alert.alert(
                "Beklenmeyen Hata",
                "Etkinlik silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                [{ text: "Tamam" }]
              );
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // Etkinliği düzenleme sayfasına yönlendir
  const handleEditEvent = () => {
    // Düzenleme için gerekli sayfaya yönlendirme (şimdilik sadece geri dönüyoruz)
    navigation.goBack();
  };
  
  // Etkinlik türüne göre simge ve etiket seç
  const getEventTypeDetails = () => {
    switch(event.type) {
      case 'meeting':
        return { iconName: 'people-outline', label: 'Toplantı', category: 'İş' };
      case 'review':
        return { iconName: 'document-text-outline', label: 'İnceleme', category: 'İş' };
      case 'sketch':
        return { iconName: 'brush-outline', label: 'Taslak', category: 'Kişisel' };
      case 'sport':
        return { iconName: 'fitness-outline', label: 'Spor', category: 'Sağlık' };
      case 'social':
        return { iconName: 'people-circle-outline', label: 'Sosyal', category: 'Kişisel' };
      default:
        return { iconName: 'calendar-outline', label: 'Etkinlik', category: 'Genel' };
    }
  };
  
  const { iconName, label, category } = getEventTypeDetails();
  const backgroundColor = event.color || '#FF9800';

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.headerContainer, 
          { backgroundColor, 
            opacity: headerAnim, 
            transform: [
              { translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                })
              }
            ]
          }
        ]}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          {/* App Bar */}
          <View style={styles.appBar}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.appBarTitle}>Etkinlik Detayı</Text>
            
            <View style={styles.placeholderButton}></View>
          </View>
          
          {/* Etkinlik İkon ve Başlık */}
          <View style={styles.eventHeaderContent}>
            <Animated.View 
              style={[
                styles.eventIconContainer,
                {
                  opacity: iconAnim,
                  transform: [
                    { scale: iconAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      })
                    },
                    { translateY: iconAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              <Ionicons name={iconName} size={32} color={backgroundColor} />
            </Animated.View>
            
            <Animated.Text 
              style={[
                styles.eventType,
                {
                  opacity: typeAnim,
                  transform: [
                    { translateY: typeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              {label}
            </Animated.Text>
            
            <Animated.Text 
              style={[
                styles.eventTitle,
                {
                  opacity: titleAnim,
                  transform: [
                    { translateY: titleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              {event.description || event.title}
            </Animated.Text>
          </View>
        </SafeAreaView>
      </Animated.View>
      
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Detay Kartı */}
        <SharedElement id={`event.${event.id}.card`}>
          <Animated.View 
            style={[
              styles.detailCard,
              {
                opacity: cardAnim,
                transform: [
                  { translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })
                  }
                ]
              }
            ]}
          >
            {/* Açıklama Bölümü */}
            <Animated.View 
              style={[
                styles.detailSection,
                {
                  opacity: descriptionAnim,
                  transform: [
                    { translateY: descriptionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={22} color={backgroundColor} />
                <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Açıklama</Text>
              </View>
              <Text style={styles.sectionContent}>{event.title}</Text>
            </Animated.View>
            
            {/* Zaman Bölümü */}
            <Animated.View 
              style={[
                styles.detailSection,
                {
                  opacity: timeAnim,
                  transform: [
                    { translateY: timeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={22} color={backgroundColor} />
                <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Zaman</Text>
              </View>
              <Text style={styles.sectionContent}>{event.startTime} - {event.endTime}</Text>
            </Animated.View>
            
            {/* Konum Bölümü (varsa) */}
            {event.location && (
              <Animated.View 
                style={[
                  styles.detailSection,
                  {
                    opacity: locationAnim,
                    transform: [
                      { translateY: locationAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="location-outline" size={22} color={backgroundColor} />
                  <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Konum</Text>
                </View>
                <Text style={styles.sectionContent}>{event.location}</Text>
              </Animated.View>
            )}
            
            {/* Kategori Bilgisi */}
            <Animated.View 
              style={[
                styles.detailSection,
                {
                  opacity: categoryAnim,
                  transform: [
                    { translateY: categoryAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="bookmark-outline" size={22} color={backgroundColor} />
                <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Kategori</Text>
              </View>
              <Text style={styles.sectionContent}>{category}</Text>
            </Animated.View>
            
            {/* Katılımcılar Bölümü (varsa) */}
            {event.participants && event.participants.length > 0 && (
              <Animated.View 
                style={[
                  styles.detailSection,
                  {
                    opacity: participantsAnim,
                    transform: [
                      { translateY: participantsAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="people-outline" size={22} color={backgroundColor} />
                  <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Katılımcılar</Text>
                </View>
                <View style={styles.participantsContainer}>
                  {event.participants.map((participant, index) => (
                    <View key={index} style={styles.participantItem}>
                      <View style={[styles.avatarCircle, { backgroundColor: backgroundColor + '20' }]}>
                        <Text style={[styles.avatarText, { color: backgroundColor }]}>
                          {participant.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.participantName}>{participant}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
            
            {/* Hatırlatıcı Bölümü (varsa) */}
            {event.reminder && (
              <Animated.View 
                style={[
                  styles.detailSection,
                  {
                    opacity: reminderAnim,
                    transform: [
                      { translateY: reminderAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="notifications-outline" size={22} color={backgroundColor} />
                  <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Hatırlatıcı</Text>
                </View>
                <Text style={styles.sectionContent}>{event.reminder}</Text>
              </Animated.View>
            )}
          </Animated.View>
        </SharedElement>
        
        {/* İşlem Butonları */}
        <Animated.View 
          style={[
            styles.actionButtonsContainer,
            {
              opacity: buttonsAnim,
              transform: [
                { translateY: buttonsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }
              ]
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: backgroundColor }]}
            onPress={handleEditEvent}
          >
            <Ionicons name="pencil-outline" size={22} color="#FFF" />
            <Text style={styles.actionButtonText}>Düzenle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteEvent}
          >
            <Ionicons name="trash-outline" size={22} color="#FFF" />
            <Text style={styles.actionButtonText}>Sil</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

// SharedElement yapılandırması
EventDetailScreen.sharedElements = (route) => {
  const { event } = route.params;
  return [`event.${event.id}.card`];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  headerContainer: {
    height: height * 0.35, // Ekranın üst kısmını kaplayan başlık
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  safeHeader: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderButton: {
    width: 40,
    height: 40,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  eventHeaderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  eventIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  eventType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: -10,
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  detailSection: {
    marginBottom: 24,
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    paddingLeft: 32,
  },
  participantsContainer: {
    paddingLeft: 32,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  participantName: {
    fontSize: 16,
    color: '#333',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteButton: {
    backgroundColor: '#E53935',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 40,
  },
});

export default EventDetailScreen; 