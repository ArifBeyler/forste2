import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
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

const TodoDetailScreen = ({ route, navigation }) => {
  const { todo, onDelete } = route.params;
  const [isCompleted, setIsCompleted] = useState(todo.completed || false);
  
  // Animasyon değerleri
  const headerAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  
  // Her bölüm için ayrı animasyon değerleri
  const descriptionAnim = useRef(new Animated.Value(0)).current;
  const timeAnim = useRef(new Animated.Value(0)).current;
  const dueDateAnim = useRef(new Animated.Value(0)).current;
  const dueTimeAnim = useRef(new Animated.Value(0)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;
  const priorityAnim = useRef(new Animated.Value(0)).current;
  const categoryAnim = useRef(new Animated.Value(0)).current;
  const reminderAnim = useRef(new Animated.Value(0)).current;
  const tagsAnim = useRef(new Animated.Value(0)).current;
  
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
      
      // 2. İkon ve başlık animasyonu
      Animated.parallel([
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 250,
          delay: 50,
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
        
        ...(todo.startTime && todo.endTime ? [
          Animated.timing(timeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          })
        ] : []),
        
        ...(todo.dueDate ? [
          Animated.timing(dueDateAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          })
        ] : []),
        
        ...(todo.dueTime ? [
          Animated.timing(dueTimeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          })
        ] : []),
        
        Animated.timing(statusAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        
        Animated.timing(priorityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        
        // Kategori animasyonu
        Animated.timing(categoryAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        
        ...(todo.reminder ? [
          Animated.timing(reminderAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          })
        ] : []),
        
        ...(todo.tags && todo.tags.length > 0 ? [
          Animated.timing(tagsAnim, {
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
  
  // Görev silme fonksiyonu
  const handleDeleteTodo = () => {
    Alert.alert(
      "Görevi Sil",
      "Bu görevi silmek istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Sil",
          onPress: () => {
            // Silme işlemini çağır
            if (onDelete) {
              onDelete(todo.id);
            }
            navigation.goBack();
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // Görevi düzenleme fonksiyonu
  const handleEditTodo = () => {
    // Düzenleme için gerekli sayfaya yönlendirme (şimdilik sadece geri dönüyoruz)
    navigation.goBack();
  };
  
  // Tamamlanma durumunu değiştir
  const toggleComplete = () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    
    // Takvim context'ten alınan fonksiyon ile görev durumunu güncelle
    if (route.params?.onToggleComplete) {
      route.params.onToggleComplete(todo.id, newStatus);
      
      // Eğer görev tamamlandıysa takvim ekranına dön
      if (newStatus) {
        // Kısa bir gecikme ile geri dönelim, böylece kullanıcı tamamlandığını görebilir
        setTimeout(() => {
          navigation.goBack();
        }, 300);
      }
    }
  };
  
  // Görev türüne göre simge ve etiket belirle
  const getTodoTypeDetails = () => {
    switch(todo.priority) {
      case 'high':
        return { iconName: 'alert-circle-outline', label: 'Yüksek Öncelik', color: '#E53935', category: 'Önemli' };
      case 'medium':
        return { iconName: 'time-outline', label: 'Orta Öncelik', color: '#FB8C00', category: 'Standart' };
      case 'low':
        return { iconName: 'checkmark-circle-outline', label: 'Düşük Öncelik', color: '#43A047', category: 'İsteğe Bağlı' };
      default:
        return { iconName: 'checkbox-outline', label: 'Görev', color: '#4CAF50', category: 'Genel' };
    }
  };
  
  const { iconName, label, color, category } = getTodoTypeDetails();
  const backgroundColor = todo.color || color;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.headerContainer, 
          { 
            backgroundColor,
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
            
            <Text style={styles.appBarTitle}>Görev Detayı</Text>
            
            <View style={styles.placeholderButton}></View>
          </View>
          
          {/* Görev Başlık Alanı */}
          <View style={styles.taskHeaderContent}>
            <Animated.View 
              style={[
                styles.taskIconContainer,
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
                styles.taskTitle,
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
              {todo.title}
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
        <SharedElement id={`todo.${todo.id}.card`}>
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
              <Text style={styles.sectionContent}>{todo.description || "Açıklama yok"}</Text>
            </Animated.View>
            
            {/* Zaman Bilgisi (varsa) */}
            {(todo.startTime && todo.endTime) && (
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
                <Text style={styles.sectionContent}>{todo.startTime} - {todo.endTime}</Text>
              </Animated.View>
            )}
            
            {/* Bitiş Tarihi (varsa) */}
            {todo.dueDate && (
              <Animated.View 
                style={[
                  styles.detailSection,
                  {
                    opacity: dueDateAnim,
                    transform: [
                      { translateY: dueDateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar-outline" size={22} color={backgroundColor} />
                  <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Bitiş Tarihi</Text>
                </View>
                <Text style={styles.sectionContent}>{todo.dueDate}</Text>
              </Animated.View>
            )}
            
            {/* Bitiş Saati (varsa) */}
            {todo.dueTime && (
              <Animated.View 
                style={[
                  styles.detailSection,
                  {
                    opacity: dueTimeAnim,
                    transform: [
                      { translateY: dueTimeAnim.interpolate({
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
                  <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Bitiş Saati</Text>
                </View>
                <Text style={styles.sectionContent}>{todo.dueTime}</Text>
              </Animated.View>
            )}
            
            {/* Durum Toggle */}
            <Animated.View 
              style={[
                styles.detailSection,
                {
                  opacity: statusAnim,
                  transform: [
                    { translateY: statusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle-outline" size={22} color={backgroundColor} />
                <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Durum</Text>
              </View>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>
                  {isCompleted ? 'Görev tamamlandı' : 'Görevi tamamla'}
                </Text>
                <Switch
                  value={isCompleted}
                  onValueChange={toggleComplete}
                  trackColor={{ false: "#E0E0E0", true: backgroundColor + '50' }}
                  thumbColor={isCompleted ? backgroundColor : "#FFFFFF"}
                  ios_backgroundColor="#E0E0E0"
                />
              </View>
            </Animated.View>
            
            {/* Öncelik Bilgisi */}
            <Animated.View 
              style={[
                styles.detailSection,
                {
                  opacity: priorityAnim,
                  transform: [
                    { translateY: priorityAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name={iconName} size={22} color={backgroundColor} />
                <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Öncelik</Text>
              </View>
              <Text style={styles.sectionContent}>{label}</Text>
            </Animated.View>
            
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
            
            {/* Hatırlatıcı (varsa) */}
            {todo.reminder && (
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
                <Text style={styles.sectionContent}>{todo.reminder}</Text>
              </Animated.View>
            )}
            
            {/* Etiketler (varsa) */}
            {todo.tags && todo.tags.length > 0 && (
              <Animated.View 
                style={[
                  styles.detailSection,
                  {
                    opacity: tagsAnim,
                    transform: [
                      { translateY: tagsAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="pricetag-outline" size={22} color={backgroundColor} />
                  <Text style={[styles.sectionTitle, { color: backgroundColor }]}>Etiketler</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {todo.tags.map((tag, index) => (
                    <View 
                      key={index} 
                      style={[styles.tagItem, { backgroundColor: backgroundColor + '15' }]}
                    >
                      <Text style={[styles.tagText, { color: backgroundColor }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
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
            onPress={handleEditTodo}
          >
            <Ionicons name="pencil-outline" size={22} color="#FFF" />
            <Text style={styles.actionButtonText}>Düzenle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteTodo}
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
TodoDetailScreen.sharedElements = (route) => {
  const { todo } = route.params;
  return [`todo.${todo.id}.card`];
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
  taskHeaderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 0,
  },
  taskIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 32,
    marginTop: 4,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingLeft: 32,
  },
  tagItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
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

export default TodoDetailScreen; 