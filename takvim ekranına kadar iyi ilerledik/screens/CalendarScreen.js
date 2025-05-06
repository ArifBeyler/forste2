import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    LayoutAnimation,
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

// AnimasyonConfigurasyon (Android için)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CalendarScreen({ navigation, route }) {
  const [selectedDay, setSelectedDay] = useState(25);
  const [welcomeMessage, setWelcomeMessage] = useState('Merhaba!');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // Animasyon değerleri
  const animation = useRef(new Animated.Value(0)).current;
  const taskBtnAnimation = useRef(new Animated.Value(0)).current;
  const eventBtnAnimation = useRef(new Animated.Value(0)).current;
  
  // FAB açma/kapama animasyonu
  const toggleFab = () => {
    const toValue = isFabOpen ? 0 : 1;
    
    // Ana buton rotasyonu
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Görev butonu animasyonu
    Animated.timing(taskBtnAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Etkinlik butonu animasyonu
    Animated.timing(eventBtnAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setIsFabOpen(!isFabOpen);
  };
  
  // Rotasyon animasyonu
  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });
  
  // Görev butonu pozisyon animasyonu
  const taskBtnY = taskBtnAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });
  
  // Etkinlik butonu pozisyon animasyonu
  const eventBtnY = eventBtnAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });
  
  // Opaklık animasyonu
  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  
  // Rastgele karşılama mesajları
  const welcomeMessages = [
    "Günaydın! ☀️",
    "Verimli bir gün olsun!",
    "Harika bir gün seni bekliyor!",
    "Bugün hedeflerine bir adım daha yaklaşacaksın!",
    "Hey, nasılsın?",
    "Yeni bir gün, yeni fırsatlar!",
    "Bugün için hazırsın!",
    "En iyisini yapacağına inanıyoruz!",
    "Günün aydınlık olsun!",
    "Motivasyonun bol olsun!",
    "Bugün kendine vakit ayırmayı unutma!",
    "Enerjin yüksek, moralin güzel olsun!",
    "Küçük adımlar büyük başarılar getirir!",
    "Potansiyelini kullan!",
    "Kendine inanmak, başarının yarısıdır!",
    "Gününü planla, hedeflerine ulaş!",
    "Bugün yeni bir başlangıç!",
    "Gülümsemek her şeyi değiştirir!",
    "Derin bir nefes al ve başla!",
    "İyi bir kahve ile güne başla!",
    "Kendine bir iyilik yap bugün!",
    "Sınırlarını zorla!",
    "Düşündüğünden daha güçlüsün!",
    "Bugün en iyi günün olsun!",
    "Olumlu düşün, olumlu yaşa!",
    "Zorluklarla başa çıkabilirsin!",
    "Her yeni gün bir hediyedir!",
    "Mutluluğu keşfet bugün!",
    "Hayallerini gerçekleştirmeye bir adım daha!",
    "Bugün değişim için mükemmel bir gün!",
    "Hayat sana gülümsüyor!",
    "Başarı senin ellerinde!",
    "Kendine iyi bak bugün!",
    "Zamanı değerli kıl!",
    "Bugün özel hisset!",
    "Bir şeyler yaratmak için harika bir gün!",
    "Bugünün tadını çıkar!",
    "Hedeflerini unutma, onlara yaklaşıyorsun!",
    "İlham dolu bir gün olsun!"
  ];
  
  // Komponentin oluşturulduğunda rastgele mesaj seç
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    setWelcomeMessage(welcomeMessages[randomIndex]);
  }, []);

  // Route parametrelerinden etkinlik yenileme durumunu kontrol et
  useEffect(() => {
    if (route.params?.refreshEvents) {
      // Yeni etkinlik eklendiğinde yenileme animasyonu yap
      refreshEvents();
      // Parametre temizliği
      navigation.setParams({ refreshEvents: undefined });
    }
  }, [route.params?.refreshEvents]);

  // Bugünün gerçek tarihini al
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  
  // Günleri her zaman Pazartesi ile başlayacak şekilde hesapla
  const calculateWeekDays = () => {
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
  };
  
  // Haftanın günleri 
  const weekDays = calculateWeekDays();
  
  // Bugünün tarihini seçili hale getir
  useEffect(() => {
    // Bugünün tarihini bul ve seçili olarak ayarla
    const today = weekDays.find(day => day.isToday);
    if (today) {
      setSelectedDay(today.date);
    }
  }, []);

  // Renk sabitleri
  const COLORS = {
    primary: '#3B82F6',    // Mavi
    today: '#FF9800',      // Turuncu
    background: '#FFFFFF', // Arka plan
    card: '#FFFFFF',       // Kart arka planı
    text: '#222222',       // Ana metin rengi
    textLight: '#777777'   // Açık metin rengi
  };

  // Etkinlik türleri
  const EVENT_TYPES = {
    MEETING: 'meeting',
    TODO: 'todo',
    REVIEW: 'review',
    SKETCH: 'sketch'
  };
  
  // Örnek etkinlikler
  const events = [
    {
      id: 1,
      title: 'Toplantı',
      description: 'Günlük Stand Up Toplantısı',
      startTime: '10:00',
      endTime: '11:00',
      color: '#FFB74D',
      type: EVENT_TYPES.MEETING,
      day: 25,
    },
    {
      id: 2,
      title: 'İnceleme',
      description: 'Ay Sonu Proje Güncellemesi',
      startTime: '12:00',
      endTime: '01:20',
      color: '#81C784',
      type: EVENT_TYPES.REVIEW,
      day: 25,
    },
    {
      id: 3,
      title: 'Taslak',
      description: 'Mobil Sağlık Uygulaması için Fikir Geliştirme ve Wireframe',
      startTime: '13:00',
      endTime: '14:20',
      color: '#64B5F6',
      type: EVENT_TYPES.SKETCH,
      day: 26,
    },
    {
      id: 4,
      title: 'Yapılacak',
      description: 'API Dokümantasyonu Hazırlama',
      startTime: '15:00',
      endTime: '16:00',
      color: '#E57373',
      type: EVENT_TYPES.TODO,
      completed: false,
      day: 27,
    }
  ];

  // Etkinlikleri yenileme fonksiyonu - gerçek uygulamada API çağrısı yapılır
  const refreshEvents = () => {
    setLoadingEvents(true);
    
    // Animasyonlu geçiş efekti
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Simüle edilmiş bir yenileme gecikmesi (gerçek uygulamada API çağrısı)
    setTimeout(() => {
      // Aktif etkinlikleri güncelle
      const filteredEvents = events.filter(event => event.day === selectedDay);
      setActiveEvents(filteredEvents);
      setLoadingEvents(false);
      
      // Animasyonlu geçiş efekti tamamlanır
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, 800);
  };

  // Seçilen güne göre etkinlikleri filtrele
  useEffect(() => {
    // Yükleme durumunu göster
    setLoadingEvents(true);
    
    // Animasyonlu geçiş
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Gecikme ekleyerek animasyon daha belirgin olsun
    setTimeout(() => {
      const filteredEvents = events.filter(event => event.day === selectedDay);
      setActiveEvents(filteredEvents);
      setLoadingEvents(false);
      
      // Başka bir animasyon
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, 400);
  }, [selectedDay]);

  // Olayları saate göre sıralama
  const sortedEvents = [...activeEvents].sort((a, b) => {
    const timeA = parseInt(a.startTime.split(':')[0]);
    const timeB = parseInt(b.startTime.split(':')[0]);
    return timeA - timeB;
  });

  // Bugünün tarihini al
  const today = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'short' };
  const formattedDate = today.toLocaleDateString('tr-TR', options);
  
  // İlk harf büyük yapma
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Görev veya etkinlik ekleme ekranlarına yönlendirme
  const handleAddTask = () => {
    toggleFab();
    // Görev ekleme ekranına yönlendirme
    navigation.navigate('AddTask');
  };
  
  const handleAddEvent = () => {
    toggleFab();
    // Etkinlik ekleme ekranına yönlendirme
    navigation.navigate('AddEvent');
  };

  // Etkinlik veya görev silme
  const deleteEvent = (eventId) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    
    // Aktif etkinlikleri de güncelle
    const updatedActiveEvents = activeEvents.filter(event => event.id !== eventId);
    setActiveEvents(updatedActiveEvents);
    
    // Burada veri tabanı güncellemesi yapılabilir
    console.log('Etkinlik silindi:', eventId);
  };

  // Etkinlik veya görev detayına yönlendirme
  const handleEventPress = (event) => {
    // Etkinlik türüne göre farklı ekranlara yönlendir
    if (event.type === EVENT_TYPES.TODO) {
      navigation.navigate('TodoDetail', { todo: event, onDelete: deleteEvent });
    } else {
      navigation.navigate('EventDetail', { event, onDelete: deleteEvent });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Üst menü düğmesi */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{welcomeMessage}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tarih */}
      <Text style={styles.dateText}>{capitalizeFirstLetter(formattedDate)}</Text>
      
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
        <View style={styles.scheduleHeaderLeft}>
          <Ionicons name="calendar-outline" size={22} color="#3B82F6" style={{marginRight: 8}} />
          <Text style={styles.scheduleHeaderText}>Programınız</Text>
        </View>
        <TouchableOpacity style={styles.scheduleFilterButton}>
          <Ionicons name="filter-outline" size={18} color="#666" />
        </TouchableOpacity>
      </View>
      
      {/* Etkinlikler listesi */}
      <ScrollView style={styles.timelineContainer}>
        {loadingEvents ? (
          // Yükleme durumunda gösterilecek içerik
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.loadingItem}>
                <View style={styles.loadingTimeColumn}>
                  <View style={styles.loadingTimeBlock} />
                </View>
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
              case EVENT_TYPES.MEETING:
                iconName = 'people-outline';
                break;
              case EVENT_TYPES.REVIEW:
                iconName = 'document-text-outline';
                break;
              case EVENT_TYPES.SKETCH:
                iconName = 'brush-outline';
                break;
              case EVENT_TYPES.TODO:
                iconName = 'checkbox-outline';
                break;
              default:
                iconName = 'calendar-outline';
            }
            
            return (
              <View key={event.id} style={styles.timelineItem}>
                {/* Saat */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>{event.startTime}</Text>
                </View>
                
                {/* Etkinlik kartı */}
                <TouchableOpacity 
                  style={styles.eventCardContainer}
                  onPress={() => handleEventPress(event)}
                >
                  <View style={styles.eventCard}>
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
                          {event.startTime} - {event.endTime}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Yapılacak türündeki kartlar için onay kutusu */}
                    {event.type === EVENT_TYPES.TODO && (
                      <TouchableOpacity 
                        style={styles.checkboxContainer}
                        onPress={() => {
                          // İçerideki tıklama olayının dışarıya yayılmasını engelle
                          // event.stopPropagation(); // React Native'de çalışmaz
                          const updatedEvent = { ...event, completed: !event.completed };
                          // Burada API çağrısı olabilir, şimdilik sadece log
                          console.log('Durum değişti:', updatedEvent);
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
      
      {/* Yapılacak Ekle Butonu */}
      <Animated.View 
        style={[
          styles.fabSecondary,
          {
            transform: [{ translateY: taskBtnY }],
            opacity: opacity
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.fabButtonSecondary, {backgroundColor: '#E57373'}]} 
          onPress={handleAddTask}
        >
          <Text style={styles.fabButtonText}>Yapılacak</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Etkinlik Ekle Butonu */}
      <Animated.View 
        style={[
          styles.fabSecondary,
          {
            transform: [{ translateY: eventBtnY }],
            opacity: opacity
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.fabButtonSecondary, {backgroundColor: '#64B5F6'}]} 
          onPress={handleAddEvent}
        >
          <Text style={styles.fabButtonText}>Etkinlik</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Ana Ekle Butonu */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.addButton} onPress={toggleFab}>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={24} color="#FFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
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
    paddingTop: 15,
    paddingBottom: 5,
  },
  headerRight: {
    flexDirection: 'row',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
  },
  welcomeText: {
    fontSize: 16,
    color: '#555', // Biraz daha koyu renk
    fontWeight: '500',
  },
  dateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222', // Daha koyu renk
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 25,
    justifyContent: 'space-between',
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
  scheduleHeaderContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  scheduleFilterButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timeColumn: {
    width: 45,
    paddingTop: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#555', // Daha koyu
  },
  eventCardContainer: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 10,
  },
  eventIconContainer: {
    width: 24,
    height: 24,
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
    fontSize: 13,
    color: '#777',
    fontWeight: '500',
  },
  checkboxContainer: {
    justifyContent: 'center',
    paddingLeft: 15,
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
    marginLeft: 22,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
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
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 1,
  },
  fabSecondary: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButtonSecondary: {
    width: 100,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    marginTop: 20,
  },
  loadingItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  loadingTimeColumn: {
    width: 60,
    paddingRight: 10,
    alignItems: 'center',
  },
  loadingTimeBlock: {
    width: 40,
    height: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  loadingCardContainer: {
    flex: 1,
  },
  loadingEventCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    height: 90,
    overflow: 'hidden',
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
}); 