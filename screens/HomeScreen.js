import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeInDown,
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

// Animasyon süresi ve gecikme değerleri (yukarıdan aşağıya sırayla)
const ANIMATION = {
  baseDuration: 600,
  baseDelay: 100,
  delayIncrement: 120
};

// Özel AnimatedSection bileşeni
const AnimatedSection = ({ children, index, style }) => {
  // Animasyon gecikmesini hesapla
  const delay = ANIMATION.baseDelay + (index * ANIMATION.delayIncrement);
  
  return (
    <Animated.View 
      style={style}
      entering={FadeInDown.delay(delay).duration(ANIMATION.baseDuration).springify()}
    >
      {children}
    </Animated.View>
  );
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
  
  // Her sayfayı yeniden ziyaret ettiğimizde animasyonları tetiklemek için
  const [animationKey, setAnimationKey] = useState(0);

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
      // Animasyon durumunu yenile - bu içeriğin yeniden yukarıdan aşağı animasyonla gelmesini sağlar
      setAnimationKey(prev => prev + 1);
      
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
    
    // Bugün ve gelecek etkinlikleri/görevleri filtrele
    const futureEvents = events.filter(event => {
      // Etkinlik tarihini al (gün değeri)
      const eventDay = event.day;
      if (!eventDay) return false;
      
      // Gün değerini tarihe çevir
      const today = now.getDate();
      
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

  // Karşılama mesajı için animasyon stili
  const welcomeTextStyle = useAnimatedStyle(() => {
    return {
      opacity: welcomeOpacity.value,
    };
  });
  
  // Su hatırlatıcısı için animasyon stili
  const waterDescStyle = useAnimatedStyle(() => {
    return {
      opacity: waterDescOpacity.value,
    };
  });
  
  // Notlar için animasyon stili
  const notesDescStyle = useAnimatedStyle(() => {
    return {
      opacity: notesDescOpacity.value,
    };
  });
  
  // Günlük için animasyon stili
  const journalDescStyle = useAnimatedStyle(() => {
    return {
      opacity: journalDescOpacity.value,
    };
  });
  
  // Proje için animasyon stili
  const projectDescStyle = useAnimatedStyle(() => {
    return {
      opacity: projectDescOpacity.value,
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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content} key={`animation-key-${animationKey}`}>
          {/* Karşılama Bölümü */}
          <AnimatedSection index={0} style={styles.header}>
            <View>
              <Animated.Text style={[styles.headerTag, welcomeTextStyle]}>
                {welcomeMessages[currentWelcomeIndex]}
              </Animated.Text>
              <Text style={styles.headerTitle}>Merhaba, {userName}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color="#333333" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </AnimatedSection>
          
          {/* Yaklaşan Öğe (Etkinlik veya Görev) */}
          <AnimatedSection index={1} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yaklaşan</Text>
            </View>
            
            {nextEvent ? (
              <TouchableOpacity 
                style={styles.nextEventCard}
                onPress={() => {
                  // Tür kontrolü ile doğru ekrana yönlendirme
                  if (nextEvent.type === 'task') {
                    handleToggleTask(nextEvent.id, nextEvent.completed);
                  } else {
                    navigation.navigate('EventDetail', { event: nextEvent });
                  }
                }}
              >
                <View style={[styles.eventIndicator, { backgroundColor: nextEvent.color || '#7E57C2' }]} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{nextEvent.title}</Text>
                  <View style={styles.eventDetailRow}>
                    <Text style={styles.eventTime}>{getEventTimeText(nextEvent)}</Text>
                    {nextEvent.type === 'task' && (
                      <View style={styles.eventTypeTag}>
                        <Text style={styles.eventTypeText}>Görev</Text>
                      </View>
                    )}
                    {nextEvent.type !== 'task' && (
                      <View style={[styles.eventTypeTag, styles.eventTypeTagEvent]}>
                        <Text style={[styles.eventTypeText, styles.eventTypeTextEvent]}>Etkinlik</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Görevse checkbox göster */}
                  {nextEvent.type === 'task' && (
                    <View style={styles.taskCheckboxContainer}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleTask(nextEvent.id, nextEvent.completed);
                        }}
                      >
                        <View style={styles.taskCheckbox}>
                          {nextEvent.completed ? (
                            <View style={styles.taskCheckboxChecked}>
                              <Ionicons name="checkmark" size={15} color="white" />
                            </View>
                          ) : (
                            <View style={styles.taskCheckboxUnchecked} />
                          )}
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.taskCheckboxLabel}>
                        {nextEvent.completed ? 'Tamamlandı' : 'Tamamla'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>Yaklaşan etkinlik veya görev bulunmuyor.</Text>
              </View>
            )}
          </AnimatedSection>
          
          {/* Planlar */}
          <AnimatedSection index={2} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Planlar</Text>
            </View>
            
            <View style={styles.planList}>
              {/* Su Hatırlatıcı */}
              <TouchableOpacity 
                style={[styles.planItem, styles.planItemBlue]}
                onPress={() => navigation.navigate('WaterTracker')}
              >
                <View style={styles.planIconContainer}>
                  <View style={[styles.planIcon, styles.planIconBlue]}>
                    <Ionicons name="water-outline" size={20} color="#3B82F6" />
                  </View>
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitleBlue}>Su hatırlatıcısı</Text>
                  <Animated.Text style={[styles.planSubtitle, waterDescStyle]}>
                    {getWaterStatusText()}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
              
              {/* Notlar */}
              <TouchableOpacity 
                style={[styles.planItem, styles.planItemOrange]}
                onPress={() => navigation.navigate('Notes')}
              >
                <View style={styles.planIconContainer}>
                  <View style={[styles.planIcon, styles.planIconOrange]}>
                    <Ionicons name="document-text-outline" size={20} color="#F59E0B" />
                  </View>
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitleOrange}>Notlar</Text>
                  <Animated.Text style={[styles.planSubtitle, notesDescStyle]}>
                    {planDescriptions.notes[currentDescriptions.notes]}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
              
              {/* Günlük */}
              <TouchableOpacity 
                style={[styles.planItem, styles.planItemPink]}
                onPress={() => navigation.navigate('Journal')}
              >
                <View style={styles.planIconContainer}>
                  <View style={[styles.planIcon, styles.planIconPink]}>
                    <Ionicons name="book-outline" size={20} color="#EC4899" />
                  </View>
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitlePink}>Günlük</Text>
                  <Animated.Text style={[styles.planSubtitle, journalDescStyle]}>
                    {planDescriptions.journal[currentDescriptions.journal]}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
              
              {/* Proje */}
              <TouchableOpacity 
                style={[styles.planItem, styles.planItemGreen]}
                onPress={() => navigation.navigate('Projects')}
              >
                <View style={styles.planIconContainer}>
                  <View style={[styles.planIcon, styles.planIconGreen]}>
                    <Ionicons name="folder-outline" size={20} color="#10B981" />
                  </View>
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitleGreen}>Proje</Text>
                  <Animated.Text style={[styles.planSubtitle, projectDescStyle]}>
                    {planDescriptions.project[currentDescriptions.project]}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
            </View>
          </AnimatedSection>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTag: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
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
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    flex: 1,
    marginLeft: 16
  },
  planList: {
    flexDirection: 'column',
  },
  planItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 12, // Alt alta sıralanması için
  },
  planItemBlue: {
    borderColor: '#DBEAFE',
    shadowColor: '#3B82F6',
    backgroundColor: '#F5F9FF',
  },
  planItemOrange: {
    borderColor: '#FEF3C7', 
    shadowColor: '#F59E0B',
    backgroundColor: '#FFFAF0',
  },
  planItemPink: {
    borderColor: '#FCE7F3',
    shadowColor: '#EC4899',
    backgroundColor: '#FDF2F8',
  },
  planItemGreen: {
    borderColor: '#D1FAE5',
    shadowColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  planIconContainer: {
    marginRight: 16,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIconBlue: {
    backgroundColor: '#EBF5FF',
  },
  planIconOrange: {
    backgroundColor: '#FEF3C7',
  },
  planIconPink: {
    backgroundColor: '#FCE7F3',
  },
  planIconGreen: {
    backgroundColor: '#D1FAE5',
  },
  planTitleBlue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 6,
  },
  planTitleOrange: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 6,
  },
  planTitlePink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EC4899',
    marginBottom: 6,
  },
  planTitleGreen: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 6,
  },
  planSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
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
    flex: 1,
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
  taskCheckbox: {
    marginRight: 12,
  },
  taskCheckboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  taskCheckboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7E57C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  taskCheckboxLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventTypeTag: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  eventTypeTagEvent: {
    backgroundColor: '#F0F9FF',
    shadowColor: '#0EA5E9',
  },
  eventTypeText: {
    fontSize: 12,
    color: '#6366F1', // indigo
    fontWeight: '500',
  },
  eventTypeTextEvent: {
    color: '#0EA5E9', // sky
  },
  emptyStateContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  taskList: {
    marginBottom: 8,
  },
  taskText: {
    fontSize: 16,
    color: COLORS.text,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textLight,
  },
  nextEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F7FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9E3FF',
    shadowColor: '#7E57C2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
  },
  eventIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 