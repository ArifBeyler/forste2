import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCalendar } from '../context/CalendarContext';

// Karşılama mesajları
const welcomeMessages = [
  "En iyisini başarabilirsin",
  "Harika bir gün seni bekliyor",
  "Bugün kendine iyi bak",
  "Hedeflerine bir adım daha yaklaşıyorsun"
];

// Plan açıklamaları
const planDescriptions = {
  water: [
    "Sağlıklı yaşam için su iç",
    "Günde 2 litre su içmeyi hedefle",
    "Su içmek enerji verir"
  ],
  notes: [
    "Önemli notlarını düzenle",
    "Fikirlerini kaydet",
    "Unutmaman gerekenleri yaz"
  ],
  journal: [
    "Duygularını ifade et",
    "Günlük tutmak rahatlama sağlar",
    "Anılarını kaydet"
  ],
  project: [
    "Görev dağılımını planla",
    "Projelerini takip et",
    "Yapılacakları planla"
  ]
};

// AsyncStorage anahtarları
const STORAGE_KEYS = {
  USER_FIRSTNAME: 'user_firstname',
  WATER_INTAKE: 'water_intake',
};

// Renk Paleti
const COLORS = {
  primary: '#ff6b6b',
  background: '#f8f9fa',
  text: '#343a40',
  textLight: '#6c757d',
};

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const { events, refresh: refreshCalendar, toggleTaskComplete } = useCalendar(); // Takvim verilerini al ve toggleTaskComplete fonksiyonunu alalım
  const navigation = useNavigation();
  const [userName, setUserName] = useState("Değerli Kullanıcı");
  const [isLoading, setIsLoading] = useState(false);
  const [waterProgress, setWaterProgress] = useState(0);
  const [waterTarget, setWaterTarget] = useState(2500); // ml olarak varsayılan hedef
  const [totalWaterIntake, setTotalWaterIntake] = useState(0);
  const [currentWelcomeIndex, setCurrentWelcomeIndex] = useState(0);
  const [currentDescriptions, setCurrentDescriptions] = useState({
    water: 0,
    notes: 0,
    journal: 0,
    project: 0
  });
  const [nextEvent, setNextEvent] = useState(null); // En yakın etkinlik
  
  // Animasyon değerleri
  const welcomeOpacity = useSharedValue(1);
  const waterDescOpacity = useSharedValue(1);
  const notesDescOpacity = useSharedValue(1);
  const journalDescOpacity = useSharedValue(1);
  const projectDescOpacity = useSharedValue(1);

  // Sayfa yüklendiğinde kullanıcı bilgilerini çek
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setIsLoading(true);
        
        // AsyncStorage'dan kullanıcı adını al
        const storedName = await AsyncStorage.getItem(STORAGE_KEYS.USER_FIRSTNAME);
        
        if (storedName) {
          setUserName(storedName);
        } else if (user?.user_metadata?.name) {
          // Kullanıcı adını Supabase'den al
          const fullName = user.user_metadata.name;
          const firstName = fullName.split(' ')[0];
          setUserName(firstName);
          
          // AsyncStorage'a kaydet
          await AsyncStorage.setItem(STORAGE_KEYS.USER_FIRSTNAME, firstName);
        }

        // Su hedefini çek
        if (user?.user_metadata?.hydration?.targetAmount) {
          setWaterTarget(parseInt(user.user_metadata.hydration.targetAmount));
        } else if (user?.user_metadata?.dailyWaterGoal) {
          setWaterTarget(parseInt(user.user_metadata.dailyWaterGoal));
        }

      } catch (error) {
        console.error('Kullanıcı bilgileri yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserInfo();
    
    // Kullanıcı bilgilerini yenile
    refreshUser();
  }, [user, refreshUser]);
  
  // Etkinlikleri izle ve en yakın etkinliği bul
  useEffect(() => {
    if (events && events.length > 0) {
      findNextEvent();
    }
  }, [events]);
  
  // Sayfa fokuslandığında etkinlikleri yenile
  useFocusEffect(
    React.useCallback(() => {
      // Takvim verilerini yenile
      refreshCalendar();
      // En yakın etkinliği bul
      findNextEvent();
      
      // Su verilerini yükle
      const loadWaterData = async () => {
        try {
          // Bugünün tarihini al
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatı
          
          // Kaydedilmiş bugünkü su miktarını al
          const savedIntake = await AsyncStorage.getItem(`${STORAGE_KEYS.WATER_INTAKE}_${today}`);
          if (savedIntake) {
            const intakeAmount = parseInt(savedIntake);
            setTotalWaterIntake(intakeAmount);
            // İlerleme yüzdesini hesapla (0-1 arası)
            const progress = Math.min(intakeAmount / waterTarget, 1);
            setWaterProgress(progress);
          } else {
            setTotalWaterIntake(0);
            setWaterProgress(0);
          }
        } catch (error) {
          console.error('Su verileri yüklenirken hata:', error);
        }
      };
      
      loadWaterData();
      
      // Önceki mesajı kademeli olarak gizle
      welcomeOpacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withDelay(100, withTiming(1, { duration: 300 }))
      );
      
      // Metinler kaybolurken yeni index'i ayarla
      setTimeout(() => {
        // Rastgele yeni bir mesaj seç (öncekinden farklı olsun)
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * welcomeMessages.length);
        } while (newIndex === currentWelcomeIndex && welcomeMessages.length > 1);
        
        setCurrentWelcomeIndex(newIndex);
      }, 300);
      
      // Diğer açıklamalar için de benzer animasyon
      const animateDescriptions = () => {
        // Su hatırlatıcısı açıklaması
        waterDescOpacity.value = withSequence(
          withTiming(0, { duration: 300 }),
          withDelay(100, withTiming(1, { duration: 300 }))
        );
        
        // Diğer açıklamaları rastgele seç
        setTimeout(() => {
          setCurrentDescriptions(prev => ({
            ...prev,
            water: Math.floor(Math.random() * planDescriptions.water.length)
          }));
        }, 300);
        
        // Notlar açıklaması
        notesDescOpacity.value = withSequence(
          withTiming(0, { duration: 300 }),
          withDelay(200, withTiming(1, { duration: 300 }))
        );
        
        setTimeout(() => {
          setCurrentDescriptions(prev => ({
            ...prev,
            notes: Math.floor(Math.random() * planDescriptions.notes.length)
          }));
        }, 400);
        
        // Günlük açıklaması
        journalDescOpacity.value = withSequence(
          withTiming(0, { duration: 300 }),
          withDelay(300, withTiming(1, { duration: 300 }))
        );
        
        setTimeout(() => {
          setCurrentDescriptions(prev => ({
            ...prev,
            journal: Math.floor(Math.random() * planDescriptions.journal.length)
          }));
        }, 500);
        
        // Proje açıklaması
        projectDescOpacity.value = withSequence(
          withTiming(0, { duration: 300 }),
          withDelay(400, withTiming(1, { duration: 300 }))
        );
        
        setTimeout(() => {
          setCurrentDescriptions(prev => ({
            ...prev,
            project: Math.floor(Math.random() * planDescriptions.project.length)
          }));
        }, 600);
      };
      
      animateDescriptions();
      
    }, [])
  );
  
  // En yakın etkinliği bulma
  const findNextEvent = () => {
    if (!events || events.length === 0) {
      setNextEvent(null);
      return;
    }
    
    const now = new Date();
    
    // Bugün ve gelecek etkinlikleri filtrele
    const futureEvents = events.filter(event => {
      // Etkinlik tarihini al (gün değeri)
      const eventDay = event.day;
      if (!eventDay) return false;
      
      // Gün değerini tarihe çevir
      const today = now.getDate();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Etkinlik günü bugün ve ilerisi mi kontrol et
      return eventDay >= today;
    });
    
    if (futureEvents.length === 0) {
      setNextEvent(null);
      return;
    }
    
    // Tarihe göre sırala
    const sortedEvents = [...futureEvents].sort((a, b) => {
      // Önce gün karşılaştırması
      if (a.day !== b.day) {
        return a.day - b.day;
      }
      
      // Gün aynıysa, saat karşılaştırması yap
      const aTime = a.startTime ? a.startTime : '23:59';
      const bTime = b.startTime ? b.startTime : '23:59';
      
      return aTime.localeCompare(bTime);
    });
    
    // En yakın etkinliği al
    setNextEvent(sortedEvents[0]);
  };

  // Animasyon stilleri
  const welcomeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: welcomeOpacity.value
    };
  });
  
  const waterDescAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: waterDescOpacity.value
    };
  });
  
  const notesDescAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: notesDescOpacity.value
    };
  });
  
  const journalDescAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: journalDescOpacity.value
    };
  });
  
  const projectDescAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: projectDescOpacity.value
    };
  });
  
  // Su miktarını formatlama
  const formatWaterAmount = (ml) => {
    return ml >= 1000 ? `${(ml/1000).toFixed(1)}L` : `${ml}ml`;
  };
  
  // Su durumu metni
  const getWaterStatusText = () => {
    if (totalWaterIntake >= waterTarget) {
      return `Hedef tamamlandı! (${formatWaterAmount(totalWaterIntake)})`;
    } else if (totalWaterIntake === 0) {
      return 'Henüz su içilmedi, hatırlatıcı ekleyin';
    } else {
      const remaining = waterTarget - totalWaterIntake;
      return `${formatWaterAmount(totalWaterIntake)} içildi, ${formatWaterAmount(remaining)} kaldı`;
    }
  };
  
  // Etkinlik zamanı hesaplama
  const getEventTimeText = (event) => {
    if (!event) return '';
    
    const now = new Date();
    const today = now.getDate();
    const eventDay = event.day;
    
    // Bugün mü?
    if (eventDay === today) {
      // Saat kontrolü
      if (event.startTime) {
        // Şu anki saat
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Etkinlik saati
        const [eventHour, eventMinute] = event.startTime.split(':').map(num => parseInt(num));
        
        // Etkinlik saati geçmiş mi?
        if (eventHour < currentHour || (eventHour === currentHour && eventMinute <= currentMinute)) {
          return 'Şu anda';
        } else {
          // Saat farkını hesapla
          const hourDiff = eventHour - currentHour;
          if (hourDiff === 0) {
            const minuteDiff = eventMinute - currentMinute;
            return `${minuteDiff} dakika sonra`;
          } else if (hourDiff === 1) {
            return 'Yaklaşık 1 saat sonra';
          } else {
            return `${hourDiff} saat sonra`;
          }
        }
      } else {
        return 'Bugün';
      }
    } else {
      // Kaç gün sonra?
      const dayDiff = eventDay - today;
      if (dayDiff === 1) {
        return 'Yarın';
      } else {
        return `${dayDiff} gün sonra`;
      }
    }
  };

  // Görev tamamlama durumunu değiştirme
  const handleToggleTask = async (id, isCompleted) => {
    try {
      const result = await toggleTaskComplete(id, !isCompleted);
      if (result.success) {
        // Güncelleme başarılı olduğunda takvim ve etkinlikleri yenile
        refreshCalendar();
        findNextEvent();
        
        // Eğer görev tamamlandıysa ve tamamlanmamış durumdaysa, takvim ekranına yönlendir
        if (!isCompleted) {
          // Biraz gecikme ekleyelim ki kullanıcı tamamlandığını görebilsin
          setTimeout(() => {
            navigation.navigate('Calendar');
          }, 300);
        }
      }
    } catch (error) {
      console.error('Görev durumu değiştirilirken hata:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Başlık bölümü */}
          <View style={styles.header}>
            <View>
              <Animated.Text style={[styles.headerTag, welcomeAnimatedStyle]}>
                {welcomeMessages[currentWelcomeIndex]}
              </Animated.Text>
              <Text style={styles.headerTitle}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <View style={styles.profileAvatar} />
            </TouchableOpacity>
          </View>

          {/* Görev bölümü - En yakın etkinlik */}
          <View style={styles.taskSection}>
            <TouchableOpacity 
              style={[
                styles.taskItem,
                nextEvent && { borderColor: nextEvent.color || '#3B82F6' }
              ]}
              onPress={() => {
                if (nextEvent) {
                  // Etkinlik detayına git
                  if (nextEvent.type === 'todo') {
                    navigation.navigate('TodoDetail', { 
                      todo: nextEvent,
                      onToggleComplete: handleToggleTask
                    });
                  } else {
                    navigation.navigate('EventDetail', { event: nextEvent });
                  }
                } else {
                  // Etkinlik yoksa takvim ekranına git
                  navigation.navigate('Calendar');
                }
              }}
            >
              <View style={styles.taskRow}>
                {nextEvent ? (
                  <>
                    <View style={styles.taskContent}>
                      <Text style={[
                        styles.taskTitlePrimary, 
                        { color: nextEvent.color || '#3B82F6' }
                      ]}>{nextEvent.title}</Text>
                      <Text style={styles.taskSubtitle}>{getEventTimeText(nextEvent)}</Text>
                    </View>
                    
                    {nextEvent.type === 'todo' ? (
                      // Eğer yapılacak görevse checkbox göster
                      <TouchableOpacity 
                        style={styles.taskCheckboxContainer}
                        onPress={(e) => {
                          e.stopPropagation(); // Ana kartın onPress'ini tetikleme
                          handleToggleTask(nextEvent.id, nextEvent.completed);
                        }}
                      >
                        <View style={[
                          styles.taskCheckbox,
                          nextEvent.completed && [styles.taskCheckboxCompleted, { backgroundColor: nextEvent.color || '#3B82F6' }]
                        ]}>
                          {nextEvent.completed && (
                            <Text style={styles.taskCheckboxIcon}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ) : (
                      // Etkinlikse ok butonu göster
                      <TouchableOpacity 
                        style={[
                          styles.taskCheckButton,
                          { backgroundColor: nextEvent.color || '#3B82F6' }
                        ]}
                      >
                        <Text style={styles.taskCheckText}>→</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.taskContent}>
                      <Text style={styles.taskTitlePrimary}>Planlanmış etkinlik yok</Text>
                      <Text style={styles.taskSubtitle}>Yeni etkinlik eklemek için takvime gidin</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.taskCheckButton}
                      onPress={() => navigation.navigate('Calendar')}
                    >
                      <Text style={styles.taskCheckText}>+</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Plan bölümü */}
          <View style={styles.planSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Plan</Text>
              <View style={styles.sectionDivider} />
            </View>

            {/* Su hatırlatıcısı */}
            <TouchableOpacity 
              style={styles.planItemBlue}
              onPress={() => navigation.navigate('WaterTracker')}
            >
              <View style={styles.planRow}>
                <View style={styles.planIconBlue}>
                  <Text style={styles.planIconText}>💧</Text>
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitleBlue}>Su hatırlatıcısı</Text>
                  <Animated.Text style={[styles.planSubtitle, waterDescAnimatedStyle]}>
                    {getWaterStatusText()}
                  </Animated.Text>
                  
                  {/* Su ilerleme çubuğu */}
                  {totalWaterIntake > 0 && (
                    <View style={styles.waterProgressContainer}>
                      <View style={[styles.waterProgressBar, { width: `${waterProgress * 100}%` }]} />
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.planAddButtonBlue}
                  onPress={() => navigation.navigate('WaterTracker')}
                >
                  <Text style={styles.planAddTextBlue}>+</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Notlar */}
            <TouchableOpacity 
              style={styles.planItemOrange}
              onPress={() => navigation.navigate('Notes')}
            >
              <View style={styles.planRow}>
                <View style={styles.planIconOrange}>
                  <Text style={styles.planIconText}>📝</Text>
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitleOrange}>Notlar</Text>
                  <Animated.Text style={[styles.planSubtitle, notesDescAnimatedStyle]}>
                    {planDescriptions.notes[currentDescriptions.notes]}
                  </Animated.Text>
                </View>
                <TouchableOpacity 
                  style={styles.planAddButtonOrange}
                  onPress={() => navigation.navigate('Notes')}
                >
                  <Text style={styles.planAddTextOrange}>+</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Günlük */}
            <TouchableOpacity 
              style={styles.planItemPink}
              onPress={() => navigation.navigate('Journal')}
            >
              <View style={styles.planRow}>
                <View style={styles.planIconPink}>
                  <Text style={styles.planIconText}>📔</Text>
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitlePink}>Günlük</Text>
                  <Animated.Text style={[styles.planSubtitle, journalDescAnimatedStyle]}>
                    {planDescriptions.journal[currentDescriptions.journal]}
                  </Animated.Text>
                </View>
                <TouchableOpacity 
                  style={styles.planAddButtonPink}
                  onPress={() => navigation.navigate('Journal')}
                >
                  <Text style={styles.planAddTextPink}>+</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Proje */}
            <TouchableOpacity 
              style={styles.planItemGreen}
              onPress={() => navigation.navigate('Projects')}
            >
              <View style={styles.planRow}>
                <View style={styles.planIconGreen}>
                  <Text style={styles.planIconText}>📁</Text>
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitleGreen}>Proje</Text>
                  <Animated.Text style={[styles.planSubtitle, projectDescAnimatedStyle]}>
                    {planDescriptions.project[currentDescriptions.project]}
                  </Animated.Text>
                </View>
                <TouchableOpacity 
                  style={styles.planAddButtonGreen}
                  onPress={() => navigation.navigate('Projects')}
                >
                  <Text style={styles.planAddTextGreen}>+</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  headerTag: {
    color: '#4B5563',
    fontSize: 14
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4B5563'
  },
  taskSection: {
    marginBottom: 32
  },
  taskItem: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  taskContent: {
    flex: 1
  },
  taskTitlePrimary: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4
  },
  taskSubtitle: {
    color: '#4B5563',
    fontSize: 14
  },
  taskCheckButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12
  },
  taskCheckText: {
    color: 'white',
    fontWeight: 'bold'
  },
  planSection: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    flex: 1,
    marginLeft: 16
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  // Blue Item
  planItemBlue: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  planIconBlue: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  planTitleBlue: {
    color: '#2563EB',
    fontWeight: '500',
    fontSize: 16
  },
  planAddButtonBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'center'
  },
  planAddTextBlue: {
    fontSize: 24,
    color: '#3B82F6'
  },
  // Orange Item
  planItemOrange: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFEDD5',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  planIconOrange: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  planTitleOrange: {
    color: '#EA580C',
    fontWeight: '500',
    fontSize: 16
  },
  planAddButtonOrange: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'center'
  },
  planAddTextOrange: {
    fontSize: 24,
    color: '#F97316'
  },
  // Pink Item
  planItemPink: {
    backgroundColor: '#FDF2F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FCE7F3',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  planIconPink: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  planTitlePink: {
    color: '#DB2777',
    fontWeight: '500',
    fontSize: 16
  },
  planAddButtonPink: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'center'
  },
  planAddTextPink: {
    fontSize: 24,
    color: '#EC4899'
  },
  // Green Item
  planItemGreen: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#DCFCE7',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  planIconGreen: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  planTitleGreen: {
    color: '#166534',
    fontWeight: '500',
    fontSize: 16
  },
  planAddButtonGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'center'
  },
  planAddTextGreen: {
    fontSize: 24,
    color: '#15803D'
  },
  planContent: {
    flex: 1
  },
  planSubtitle: {
    color: '#4B5563',
    fontSize: 14
  },
  planIconText: {
    fontSize: 24
  },
  waterProgressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#DBEAFE',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  waterProgressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  // Yapılacak görev checkbox stillerini ekle
  taskCheckboxContainer: {
    justifyContent: 'center',
    marginLeft: 12,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FF',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  taskCheckboxIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 