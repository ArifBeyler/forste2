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

  // Sayfa odaklandığında su verilerini yükle
  useFocusEffect(
    React.useCallback(() => {
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
      
      // Açıklama metinlerini de değiştir
      const animateDescriptions = () => {
        // Su hatırlatıcısı
        waterDescOpacity.value = withSequence(
          withTiming(0, { duration: 500 }),
          withDelay(100, withTiming(1, { duration: 500 }))
        );
        
        // Notlar
        notesDescOpacity.value = withSequence(
          withDelay(150, withTiming(0, { duration: 500 })),
          withDelay(250, withTiming(1, { duration: 500 }))
        );
        
        // Günlük
        journalDescOpacity.value = withSequence(
          withDelay(300, withTiming(0, { duration: 500 })),
          withDelay(400, withTiming(1, { duration: 500 }))
        );
        
        // Proje
        projectDescOpacity.value = withSequence(
          withDelay(450, withTiming(0, { duration: 500 })),
          withDelay(550, withTiming(1, { duration: 500 }))
        );
        
        // Metinler kaybolduğunda yeni açıklamaları ayarla
        setTimeout(() => {
          setCurrentDescriptions({
            water: Math.floor(Math.random() * planDescriptions.water.length),
            notes: Math.floor(Math.random() * planDescriptions.notes.length),
            journal: Math.floor(Math.random() * planDescriptions.journal.length),
            project: Math.floor(Math.random() * planDescriptions.project.length)
          });
        }, 650);
      };
      
      animateDescriptions();
      
      return () => {};
    }, [])
  );

  // Animasyon stilleri
  const welcomeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: welcomeOpacity.value,
    };
  });
  
  const waterDescAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: waterDescOpacity.value,
    };
  });
  
  const notesDescAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: notesDescOpacity.value,
    };
  });
  
  const journalDescAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: journalDescOpacity.value,
    };
  });
  
  const projectDescAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: projectDescOpacity.value,
    };
  });

  // Miktarı formatlama
  const formatWaterAmount = (ml) => {
    return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${ml} ml`;
  };

  // Su kutucuğu için açıklama metni
  const getWaterStatusText = () => {
    if (totalWaterIntake === 0) return planDescriptions.water[currentDescriptions.water];
    if (totalWaterIntake >= waterTarget) return "Bugünkü hedefe ulaştın!";
    const percentage = Math.floor((totalWaterIntake / waterTarget) * 100);
    return `Bugün ${formatWaterAmount(totalWaterIntake)} içtin (${percentage}%)`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

          {/* Görev bölümü */}
          <View style={styles.taskSection}>
            <TouchableOpacity style={styles.taskItem}>
              <View style={styles.taskRow}>
                <View style={styles.taskIconPrimary}>
                  <View style={styles.taskIconInner} />
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitlePrimary}>Mobil uygulama tasarımı</Text>
                  <Text style={styles.taskSubtitle}>15 saat sonra</Text>
                </View>
                <TouchableOpacity style={styles.taskCheckButton}>
                  <Text style={styles.taskCheckText}>✓</Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  taskIconPrimary: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  taskIconInner: {
    width: 16,
    height: 16,
    backgroundColor: 'white',
    borderRadius: 4
  },
  taskContent: {
    flex: 1
  },
  taskTitlePrimary: {
    color: '#3B82F6',
    fontWeight: '500',
    fontSize: 16
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
    justifyContent: 'center'
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
  }
}); 