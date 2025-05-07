import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SharedElement } from 'react-navigation-shared-element';
import { useCalendar } from '../context/CalendarContext';

// AnimasyonConfigurasyon (Android için)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CalendarScreen({ navigation, route }) {
  const { 
    selectedDay, 
    setSelectedDay, 
    activeEvents, 
    loading, 
    refresh,
    toggleTaskComplete,
    deleteEvent: contextDeleteEvent
  } = useCalendar();
  
  // İçeride de tanımlayalım ki component içindeki fonksiyonlar erişebilsin
  const INTERNAL_EVENT_TYPES = {
    MEETING: 'meeting',
    TODO: 'todo',
    REVIEW: 'review',
    SKETCH: 'sketch'
  };
  
  const [welcomeMessage, setWelcomeMessage] = useState('Merhaba!');
  const initialMountRef = useRef(true);
  const lastRouteParamsRef = useRef(null);
  const isRefreshPending = useRef(false);
  const refreshTimeoutRef = useRef(null);
  
  // Yenileme ikonu için animasyon değeri
  const refreshIconAnim = useRef(new Animated.Value(0)).current;
  
  // Yenileme ikonu döndürme
  const startRefreshAnimation = () => {
    refreshIconAnim.setValue(0);
    Animated.timing(refreshIconAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.linear
    }).start();
  };
  
  // Yenileme ikonu döndürme değeri
  const refreshSpin = refreshIconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Ekranın manuel olarak yenilenmesi - düğme tepkimesi için
  const handleRefresh = useCallback(() => {
    // Eğer yenileme zaten bekliyorsa veya yükleme yapılıyorsa işlem yapma
    if (isRefreshPending.current || loading) {
      console.log("Zaten yenileme yapılıyor, işlem atlanıyor");
      return;
    }
    
    // Önceki zamanlayıcıyı temizle
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    console.log("MANUEL YENİLEME BAŞLATILIYOR... ⟲");
    isRefreshPending.current = true;
    
    // Yenileme animasyonunu başlat
    startRefreshAnimation();
    
    // Kullanıcıya görsel geri bildirim için bir toast gösterebiliriz
    // Toast.show({ message: 'Takvim yenileniyor...' });
    
    refreshTimeoutRef.current = setTimeout(() => {
      refresh(); // Takvim verilerini yenile
      isRefreshPending.current = false;
      refreshTimeoutRef.current = null;
    }, 200);
  }, [refresh, loading]);
  
  // Rastgele karşılama mesajları
  const welcomeMessages = [
    "Günaydın! ☀️",
    "Verimli günler!",
    "Harika bir gün!",
    "Hedeflerine odaklan!",
    "Merhaba!",
    "Yeni bir gün!",
    "Hazır mısın?",
    "En iyisini yap!",
    "Güzel bir gün!",
    "Motivasyon!",
    "Kendine zaman ayır!",
    "Enerjik ol!",
    "Küçük adımlar, büyük başarılar!",
    "Potansiyelini kullan!",
    "İnan kendine!",
    "Planla ve başar!",
    "Yeni başlangıç!",
    "Gülümse!",
    "Derin nefes al!",
    "Güne kahveyle başla!",
    "Kendine iyi bak!",
    "Sınırlarını zorla!",
    "Güçlüsün!",
    "İyi günler!",
    "Pozitif ol!",
    "Başarabilirsin!",
    "Bugün bir hediye!",
    "Mutlu ol!",
    "Hayallerine ulaş!",
    "Değişim için hazır mısın?",
    "Hayat güzel!",
    "Başarı senin!",
    "Kendine iyi bak!",
    "Zamanını değerli kıl!",
    "Özel hisset!",
    "Yarat!",
    "Keyif al!",
    "Hedeflerine yaklaşıyorsun!",
    "İlham dolu bir gün!"
  ];
  
  // Komponentin ilk oluşturulması
  useEffect(() => {
    // Rastgele mesaj seç
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    setWelcomeMessage(welcomeMessages[randomIndex]);
    
    // Başlangıçta bugünün tarihini bul ve seçili olarak ayarla
    // Bu selectedDay değişince otomatik olarak veriler getirilecek
    if (initialMountRef.current) {
      const today = weekDays.find(day => day.isToday);
      if (today) {
        console.log("Bugünün tarihini seçili yapıyorum:", today.date);
        setSelectedDay(today.date);
      }
      initialMountRef.current = false;
    }
  }, [weekDays]); // sadece weekDays değiştiğinde çalışsın

  // Route parametrelerinden etkinlik yenileme - SADECE ETKİNLİK/GÖREV EKLEME SONRASI
  useEffect(() => {
    // Önceki ve şu anki route.params'ı karşılaştır
    const currentRefreshParam = route.params?.refreshEvents;
    const prevRefreshParam = lastRouteParamsRef.current;
    
    // Sadece etkinlik/görev eklemeden sonra refresh yap
    if (currentRefreshParam && currentRefreshParam !== prevRefreshParam) {
      console.log("Yeni etkinlik/görev eklendi, sadece bu durumda veriler yenileniyor...");
      
      // Otomatik arka plan yenilemesi yerine sadece gösterilen günü güncelle
      handleRefresh();
      
      lastRouteParamsRef.current = currentRefreshParam;
      // Parametre temizliği
      navigation.setParams({ refreshEvents: undefined });
    }
  }, [route.params?.refreshEvents, navigation, handleRefresh]);

  // Bugünün gerçek tarihini al
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  
  // Günleri her zaman Pazartesi ile başlayacak şekilde hesapla - dışarı çıkaralım
  const calculateWeekDays = useCallback(() => {
    const days = [];
    
    // Pazartesi'ye ayarla
    const startDate = new Date(currentDate);
    const dayOfWeek = currentDate.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
    
    // Eğer bugün Pazar günü ise (0), 6 gün geri gideriz (önceki haftanın Pazartesi'si)
    // Değilse bugün - (gün - 1) yaparak bu haftanın Pazartesi'sine gideriz
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(currentDate.getDate() - daysToSubtract);
    
    // Haftanın günleri (Türkçe)
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    
    // 7 gün için döngü
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push({
        day: dayNames[i],
        date: day.getDate(),
        isToday: day.getDate() === currentDay && 
                day.getMonth() === currentDate.getMonth() &&
                day.getFullYear() === currentDate.getFullYear()
      });
    }
    
    return days;
  }, [currentDate, currentDay]);
  
  // Haftanın günleri - memoize et
  const weekDays = React.useMemo(() => calculateWeekDays(), [calculateWeekDays]);
  
  // Renk sabitleri
  const COLORS = {
    primary: '#3B82F6',    // Mavi
    today: '#FF9800',      // Turuncu
    background: '#FFFFFF', // Arka plan
    card: '#FFFFFF',       // Kart arka planı
    text: '#222222',       // Ana metin rengi
    textLight: '#777777'   // Açık metin rengi
  };

  // Olayları saate göre sıralama - memoize et
  const sortedEvents = React.useMemo(() => {
    // activeEvents null veya undefined ise boş dizi döndür
    if (!activeEvents || !Array.isArray(activeEvents) || activeEvents.length === 0) {
      return [];
    }
    
    return [...activeEvents].sort((a, b) => {
      // startTime tanımlı değilse hata almamak için 0 atama
      const timeA = a.startTime ? parseInt(a.startTime.split(':')[0] || '0') : 0;
      const timeB = b.startTime ? parseInt(b.startTime.split(':')[0] || '0') : 0;
      return timeA - timeB;
    });
  }, [activeEvents]);

  // İlk harf büyük yapma
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Görev veya etkinlik ekleme ekranlarına yönlendirme
  const handleAddTask = useCallback(() => {
    // Görev ekleme ekranına yönlendirme
    navigation.navigate('AddTask');
  }, [navigation]);
  
  const handleAddEvent = useCallback(() => {
    // Etkinlik ekleme ekranına yönlendirme
    navigation.navigate('AddEvent');
  }, [navigation]);

  // Görev tamamlama fonksiyonu
  const handleToggleComplete = useCallback(async (taskId, isCompleted) => {
    console.log("CalendarScreen - handleToggleComplete fonksiyonu çağrıldı, ID:", taskId, "Tamamlandı:", isCompleted);
    if (!taskId) {
      console.error("Güncellenecek görev ID'si belirtilmemiş");
      return { success: false, error: "Geçersiz görev ID'si" };
    }
    
    try {
      // Context'teki toggleTaskComplete fonksiyonunu çağır
      const result = await toggleTaskComplete(taskId, isCompleted);
      
      if (result.success) {
        console.log("Görev durumu başarıyla güncellendi, verileri yeniliyorum");
        // İşlem başarılıysa ekranı yenile
        handleRefresh();
      } else {
        console.error("Görev durumu güncelleme işlemi başarısız:", result.error);
      }
      
      return result;
    } catch (error) {
      console.error("Görev durumu güncellenirken beklenmeyen hata:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" 
      };
    }
  }, [toggleTaskComplete, handleRefresh]);

  // Etkinlik veya görev detayına yönlendirme
  const handleEventPress = useCallback((event) => {
    // Etkinlik türüne göre farklı ekranlara yönlendir
    if (event.type === INTERNAL_EVENT_TYPES.TODO) {
      navigation.navigate('TodoDetail', { 
        todo: event, 
        onDelete: deleteEvent,
        onToggleComplete: handleToggleComplete 
      });
    } else {
      navigation.navigate('EventDetail', { event, onDelete: deleteEvent });
    }
  }, [navigation, deleteEvent, handleToggleComplete]);

  // İlk yüklenme veya yeni veri eklendiğinde gösterilecek olan yükleniyor animasyonu
  const renderLoadingView = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  };

  // Zaman formatlamak için yardımcı fonksiyon
  const formatEventTime = (event) => {
    if (event.isAllDay) {
      return 'Tüm gün';
    }
    
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`;
    }
    
    if (event.startTime) {
      return event.startTime;
    }
    
    return 'Tüm gün';
  };

  // Etkinlik silme fonksiyonu
  const deleteEvent = useCallback(async (eventId) => {
    console.log("CalendarScreen - deleteEvent fonksiyonu çağrıldı, ID:", eventId);
    if (!eventId) {
      console.error("Silinecek etkinlik ID'si belirtilmemiş");
      return { success: false, error: "Geçersiz etkinlik ID'si" };
    }
    
    try {
      // Context'teki deleteEvent fonksiyonunu çağır
      const result = await contextDeleteEvent(eventId);
      
      if (result.success) {
        console.log("Etkinlik başarıyla silindi, güncel verileri getiriyorum");
        // İşlem başarılıysa ekranı yenile
        handleRefresh();
      } else {
        console.error("Etkinlik silme işlemi başarısız:", result.error);
      }
      
      return result;
    } catch (error) {
      console.error("Etkinlik silme sırasında beklenmeyen hata:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" 
      };
    }
  }, [contextDeleteEvent, handleRefresh]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Üst menü düğmesi */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>{welcomeMessage}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Animated.View style={{ transform: [{ rotate: refreshSpin }] }}>
              <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
            </Animated.View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => navigation.navigate('CalendarStatistics')}
          >
            <Ionicons name="stats-chart" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Haftanın günleri */}
      <View style={styles.weekContainer}>
        {weekDays.map((item) => {
          const isToday = item.isToday;
          const isSelected = selectedDay === item.date;
          
          return (
            <TouchableOpacity
              key={item.date}
              style={[
                styles.dayBox,
                isSelected && { backgroundColor: isToday ? COLORS.today : COLORS.primary },
                isToday && !isSelected && styles.todayBox
              ]}
              onPress={() => setSelectedDay(item.date)}
            >
              <Text 
                style={[
                  styles.dayBoxWeekday, 
                  isSelected && styles.selectedDayBoxText,
                  isToday && !isSelected && { color: COLORS.today, fontWeight: '600' }
                ]}
              >
                {item.day}
              </Text>
              <Text 
                style={[
                  styles.dayBoxDate, 
                  isSelected && styles.selectedDayBoxText,
                  isToday && !isSelected && { color: COLORS.today, fontWeight: 'bold' }
                ]}
              >
                {item.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Programınız başlığı */}
      <View style={styles.scheduleHeaderContainer}>
        <View style={styles.headerDivider} />
        <Text style={styles.scheduleHeaderText}>Programınız</Text>
        <View style={styles.headerDivider} />
      </View>
      
      {/* Etkinlikler listesi */}
      <ScrollView 
        style={styles.timelineContainer}
        contentContainerStyle={styles.timelineContentContainer}
      >
        {loading ? (
          // Yükleme durumunda gösterilecek içerik
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.loadingItem}>
                <View style={styles.loadingCardContainer}>
                  <View style={styles.loadingEventCard}>
                    <View style={styles.loadingCardLeft} />
                    <View style={styles.loadingCardContent}>
                      <View style={styles.loadingTitle} />
                      <View style={styles.loadingDescription} />
                      <View style={styles.loadingTime} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : sortedEvents.length > 0 ? (
          sortedEvents.map((event, index) => {
            // Etkinlik türüne göre simge seç
            let iconName;
            switch(event.type) {
              case INTERNAL_EVENT_TYPES.MEETING:
                iconName = 'people-outline';
                break;
              case INTERNAL_EVENT_TYPES.TODO:
                iconName = 'checkbox-outline';
                break;
              case INTERNAL_EVENT_TYPES.REVIEW:
                iconName = 'document-text-outline';
                break;
              case INTERNAL_EVENT_TYPES.SKETCH:
                iconName = 'brush-outline';
                break;
              default:
                iconName = 'calendar-outline';
            }
            
            return (
              <View key={event.id} style={styles.timelineItem}>
                {/* Etkinlik kartı - Saati Kaldırıyoruz */}
                <TouchableOpacity 
                  style={styles.eventCardContainer}
                  onPress={() => handleEventPress(event)}
                >
                  <SharedElement id={`${event.type === INTERNAL_EVENT_TYPES.TODO ? 'todo' : 'event'}.${event.id}.card`}>
                    <View style={[
                      styles.eventCard,
                      event.type === INTERNAL_EVENT_TYPES.TODO && styles.todoCard
                    ]}>
                      <View 
                        style={[
                          styles.eventLeftBorder, 
                          { backgroundColor: event.color }
                        ]} 
                      />
                      
                      <View style={styles.eventContent}>
                        {/* Kategori başlığı ve ikon yan yana */}
                        <View style={styles.categoryRow}>
                          <View style={[styles.eventIconContainer, { backgroundColor: `${event.color}20` }]}>
                            <Ionicons name={iconName} size={16} color={event.color} />
                          </View>
                          <Text style={[styles.eventCategory, { color: event.color }]}>
                            {event.title}
                          </Text>
                        </View>
                        
                        <Text style={styles.eventTitle}>{event.description}</Text>
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="time-outline" size={14} color="#999" style={{marginRight: 4}} />
                          <Text style={styles.eventTime}>
                            {formatEventTime(event)}
                          </Text>
                          
                          {/* Todo için tamamlanma durumunu göster */}
                          {event.type === INTERNAL_EVENT_TYPES.TODO && (
                            <View style={styles.todoStatusContainer}>
                              <View style={[styles.todoStatusDot, {backgroundColor: event.completed ? '#4CAF50' : '#FFA000'}]} />
                              <Text style={[styles.todoStatusText, {color: event.completed ? '#4CAF50' : '#FFA000'}]}>
                                {event.completed ? 'Tamamlandı' : 'Bekliyor'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {/* Yapılacak türündeki kartlar için onay kutusu */}
                      {event.type === INTERNAL_EVENT_TYPES.TODO && (
                        <TouchableOpacity 
                          style={styles.checkboxContainer}
                          onPress={(e) => {
                            e.stopPropagation();
                            // Görev tamamlama durumunu değiştirme işlemi
                            toggleTaskComplete(event.id, !event.completed);
                          }}
                        >
                          <View style={[
                            styles.checkbox,
                            event.completed && styles.checkboxCompleted
                          ]}>
                            {event.completed && (
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            )}
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </SharedElement>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ddd" />
            <Text style={styles.emptyStateText}>Bugün için etkinlik yok</Text>
            <Text style={styles.emptyStateSubText}>Yeni bir etkinlik eklemek için + butonuna tıklayın</Text>
          </View>
        )}
        
        {/* Zaman çizgisi noktası */}
        <View style={styles.timelineDotContainer}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
        </View>
      </ScrollView>
      
      {/* Yükleniyor göstergesi */}
      {renderLoadingView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Koyu temadan açık temaya dönüştürme
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF3FF',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E6EFFD',
    marginRight: 10,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF3FF',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E6EFFD',
  },
  welcomeText: {
    fontSize: 19,
    color: '#555', // Biraz daha koyu renk
    fontWeight: '500',
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8, // Sol boşluğu azalt
    marginVertical: 15,
    justifyContent: 'space-between',
  },
  scheduleHeaderContainer: {
    marginBottom: 15,
    marginTop: 5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  headerDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1E3FF',
  },
  scheduleHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginHorizontal: 15,
    textAlign: 'center',
  },
  timelineContainer: {
    flex: 1,
  },
  timelineContentContainer: {
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timelineItem: {
    marginBottom: 15,
    width: '85%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  eventCardContainer: {
    width: '100%',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0.75,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  eventLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  eventContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  eventCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
    lineHeight: 20,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  checkboxContainer: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FF',
  },
  checkboxCompleted: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  timelineDotContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    marginLeft: 0,
    alignSelf: 'center',
    width: '85%',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    marginBottom: 5,
  },
  timelineLine: {
    height: 80,
    width: 2,
    backgroundColor: '#D1E3FF',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '85%',
    alignSelf: 'center',
  },
  loadingItem: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTimeColumn: {
    display: 'none', // Gizle
  },
  loadingCardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEventCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    height: 90,
    overflow: 'hidden',
    width: '100%',
    borderWidth: 0.75,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingCardLeft: {
    width: 4,
    backgroundColor: '#e0e0e0',
  },
  loadingCardContent: {
    flex: 1,
    padding: 16,
  },
  loadingTitle: {
    width: '60%',
    height: 15,
    backgroundColor: '#eeeeee',
    borderRadius: 4,
    marginBottom: 10,
  },
  loadingDescription: {
    width: '80%',
    height: 12,
    backgroundColor: '#eeeeee',
    borderRadius: 4,
    marginBottom: 8,
  },
  loadingTime: {
    width: '40%',
    height: 10,
    backgroundColor: '#eeeeee',
    borderRadius: 4,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    alignSelf: 'center',
    width: '85%',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  refreshIcon: {
    width: 24,
    height: 24,
  },
  todoStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  todoStatusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 5,
  },
  todoStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  todoCard: {
    backgroundColor: '#FAFBFF',
    borderWidth: 0.75,
    borderColor: '#E6EFFD',
    shadowColor: '#4A89F3',
    shadowOpacity: 0.12,
  },
  statsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginLeft: 8,
  },
  dayBox: {
    width: 45,
    height: 55,
    backgroundColor: '#F6F6F6', // Daha açık arkaplan
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Daha belirgin gölge
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Daha güçlü gölge efekti
  },
  todayBox: {
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  selectedDayBox: {
    backgroundColor: '#3B82F6',
  },
  dayBoxWeekday: {
    fontSize: 13,
    color: '#555', // Daha koyu renk
    marginBottom: 2,
  },
  dayBoxDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222', // Daha koyu renk
  },
  selectedDayBoxText: {
    color: '#FFF',
  },
}); 