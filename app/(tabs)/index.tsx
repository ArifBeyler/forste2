import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// LocalStorage anahtarları
const STORAGE_KEYS = {
  USERNAME: 'user_name',
  USER_FIRSTNAME: 'user_firstname',
  WELCOME_MESSAGE_DATE: 'welcomeMessageDate',
  WELCOME_MESSAGE_COUNT: 'welcomeMessageCount',
};

// Karşılama mesajları
const welcomeMessages = [
  "En iyisini başarabilirsin",
  "Bugün harika bir gün olacak",
  "Kendine inanmaya devam et",
  "Küçük adımlar büyük sonuçlar doğurur",
  "Bugün neler başaracağını düşün",
  "Hedeflerine odaklan",
  "Hayallerinin peşinden koş",
  "Her şey kontrol altında",
  "Kendine iyi bak",
  "İlerlemeye devam et"
];

// Kart açıklamaları
const cardDescriptions = {
  water: [
    "Sağlıklı yaşam için su iç",
    "Günde 2 litre su içmeyi unutma",
    "Vücudun suya ihtiyaç duyuyor",
    "Bol su iç, enerjini yükselt",
    "Su içmek metabolizmanı hızlandırır",
    "Daha zinde hissetmek için su iç",
    "Cildin için su önemli",
    "Su içmeyi ihmal etme",
    "Sağlık için su şart",
    "Düzenli su tüket"
  ],
  notes: [
    "Önemli notlarını düz",
    "Fikirlerin kaybolmasın",
    "Aklına gelen her şeyi not et",
    "Notlar hayatını kolaylaştırır",
    "Unutmamak için not al",
    "Planlarını not et",
    "Fikirlerini sakla",
    "Notlar hafızanı güçlendirir",
    "Her fikir değerlidir, not et",
    "Önemli şeyleri not almayı unutma"
  ],
  journal: [
    "Duygularını ifade et",
    "Bugün nasıl hissettiğini yaz",
    "Düşüncelerini kaydetttin mi?",
    "Kendini keşfet",
    "Günlük tutmak terapi gibidir",
    "Duygularını yazıya dök",
    "Her günün bir hikaye",
    "Anılarını yazarak sakla",
    "Günlük tutmak zihnini temizler",
    "Duyguların senin gücün"
  ],
  project: [
    "Görev dağılımını planla",
    "Projelerini yönet",
    "Yapılacakları organize et",
    "İş akışını planla",
    "Ekibinle senkronize ol",
    "Görevleri takip et",
    "Proje zaman çizelgeni oluştur",
    "İş yükünü dengele",
    "Görevleri önceliklendir",
    "Daha verimli çalış"
  ]
};

// Animasyon bileşeni
const AnimatedCard = ({ delay, children, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Değişen metin bileşeni
const AnimatedDescription = ({ descriptions, style }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Önce metni kaybet
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Sonra indeksi değiştir
        setCurrentIndex((prevIndex) => (prevIndex + 1) % descriptions.length);
        
        // Sonra metni geri getir
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 5000); // 5 saniyede bir değiştir

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Animated.Text style={[style, { opacity: fadeAnim }]}>
      {descriptions[currentIndex]}
    </Animated.Text>
  );
};

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [welcomeMessage, setWelcomeMessage] = useState(welcomeMessages[0]);
  const [userName, setUserName] = useState('Misafir');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const screenFadeAnim = useRef(new Animated.Value(1)).current;
  
  // İlk yükleme - AsyncStorage'dan kullanıcı adını al
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // AsyncStorage'dan önce kullanıcı adını ve karşılama mesajını al
        const storedFirstName = await AsyncStorage.getItem(STORAGE_KEYS.USER_FIRSTNAME);
        
        // Kullanıcı adı yerel depolamada varsa hemen göster
        if (storedFirstName) {
          setUserName(storedFirstName);
        }
        
        // Karşılama mesajını belirle
        await loadWelcomeMessage();
        
        // Ekranı göster
        setIsInitialized(true);
      } catch (error) {
        console.error('Ekran başlatılırken hata:', error);
        setIsInitialized(true); // Hata olsa bile ekranı göster
      }
    };
    
    initializeScreen();
  }, []);
  
  // Kullanıcı değişikliklerini izle ve güncel bilgileri yerel depolamaya kaydet
  useEffect(() => {
    const updateUserData = async () => {
      if (user?.user_metadata?.name) {
        const fullName = user.user_metadata.name;
        const firstName = fullName.split(' ')[0];
        
        // Kullanıcı adını güncelle (eğer yerel depolamadakinden farklıysa)
        const storedFirstName = await AsyncStorage.getItem(STORAGE_KEYS.USER_FIRSTNAME);
        if (firstName !== storedFirstName) {
          // Kullanıcı adını ve ilk adını kaydet
          await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, fullName);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_FIRSTNAME, firstName);
          setUserName(firstName);
        }
      } else if (user) {
        // Kullanıcı varsa ama adı yoksa, verileri yenile
        await refreshUser();
      }
    };
    
    if (isInitialized && user) {
      updateUserData();
    }
  }, [user, isInitialized]);
  
  // Karşılama mesajını yükleme
  const loadWelcomeMessage = async () => {
    try {
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.WELCOME_MESSAGE_DATE);
      const changeCount = await AsyncStorage.getItem(STORAGE_KEYS.WELCOME_MESSAGE_COUNT);
      
      if (!lastDate || lastDate !== today) {
        const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
        setWelcomeMessage(welcomeMessages[randomIndex]);
        await AsyncStorage.setItem(STORAGE_KEYS.WELCOME_MESSAGE_DATE, today);
        await AsyncStorage.setItem(STORAGE_KEYS.WELCOME_MESSAGE_COUNT, '1');
      } else {
        const count = parseInt(changeCount || '0');
        if (count < 10) {
          const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
          setWelcomeMessage(welcomeMessages[randomIndex]);
          await AsyncStorage.setItem(STORAGE_KEYS.WELCOME_MESSAGE_COUNT, (count + 1).toString());
        }
      }
    } catch (error) {
      console.error('Karşılama mesajı ayarlanırken hata:', error);
    }
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.text}>Hazırlanıyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View>
                <Text style={styles.welcomeMessage}>{welcomeMessage}</Text>
                <Text style={styles.userName}>
                  {userName}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.userIcon}
              >
                <View style={styles.userIconInner} />
              </TouchableOpacity>
            </View>

            <AnimatedCard delay={100} style={styles.card}>
              <TouchableOpacity style={styles.cardInner}>
                <View style={styles.cardIcon}>
                  <View style={styles.cardIconInner} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Mobil uygulama tasarımı</Text>
                  <Text style={styles.cardSubtitle}>15 saat sonra</Text>
                </View>
                <TouchableOpacity style={styles.cardButton}>
                  <Text style={styles.cardButtonText}>✓</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </AnimatedCard>

            <View style={styles.plan}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>Plan</Text>
                <View style={styles.planSeparator} />
              </View>

              {/* Su hatırlatıcısı */}
              <AnimatedCard delay={200}>
                <TouchableOpacity style={styles.card}>
                  <View style={styles.cardInner}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardIconText}>💧</Text>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>Su hatırlatıcısı</Text>
                      <AnimatedDescription 
                        descriptions={cardDescriptions.water}
                        style={styles.cardDescription}
                      />
                    </View>
                    <TouchableOpacity style={styles.cardButton}>
                      <Text style={styles.cardButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </AnimatedCard>

              {/* Notlar */}
              <AnimatedCard delay={300}>
                <TouchableOpacity style={styles.card}>
                  <View style={styles.cardInner}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardIconText}>📝</Text>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>Notlar</Text>
                      <AnimatedDescription 
                        descriptions={cardDescriptions.notes}
                        style={styles.cardDescription}
                      />
                    </View>
                    <TouchableOpacity style={styles.cardButton}>
                      <Text style={styles.cardButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </AnimatedCard>

              {/* Günlük */}
              <AnimatedCard delay={400}>
                <TouchableOpacity style={styles.card}>
                  <View style={styles.cardInner}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardIconText}>📔</Text>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>Günlük</Text>
                      <AnimatedDescription 
                        descriptions={cardDescriptions.journal}
                        style={styles.cardDescription}
                      />
                    </View>
                    <TouchableOpacity style={styles.cardButton}>
                      <Text style={styles.cardButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </AnimatedCard>

              {/* Proje */}
              <AnimatedCard delay={500}>
                <TouchableOpacity style={styles.card}>
                  <View style={styles.cardInner}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardIconText}>📁</Text>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>Proje</Text>
                      <AnimatedDescription 
                        descriptions={cardDescriptions.project}
                        style={styles.cardDescription}
                      />
                    </View>
                    <TouchableOpacity style={styles.cardButton}>
                      <Text style={styles.cardButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </AnimatedCard>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    paddingBottom: 160,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeMessage: {
    color: '#4B5563',
    fontSize: 14,
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4B5563',
  },
  card: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4B5563',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#4B5563',
    fontSize: 14,
  },
  cardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  plan: {
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  planSeparator: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  cardDescription: {
    color: '#4B5563',
    fontSize: 14,
  },
});
