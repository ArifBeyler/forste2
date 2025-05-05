import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
    Easing,
    FadeIn,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

// AsyncStorage anahtarları
const STORAGE_KEYS = {
  WATER_INTAKE: 'water_intake',
  WATER_HISTORY: 'water_history'
};

// Su miktarları seçenekleri (ml)
const WATER_AMOUNTS = [100, 200, 250, 300, 500];

// Ekran boyutlarını al
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WaterTrackerScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(2500); // Varsayılan hedef
  const [totalIntake, setTotalIntake] = useState(0);
  const [waterHistory, setWaterHistory] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState(WATER_AMOUNTS[2]); // Varsayılan seçilen miktar
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState([]);
  
  // Animasyon değerleri
  const progressAnimation = useSharedValue(0);
  const waterDropAnimation = useSharedValue(1);
  const addButtonScale = useSharedValue(1);
  const progressTextScale = useSharedValue(1);
  
  // Referanslar
  const historyListRef = useRef(null);
  const confettiRef = useRef(null);
  const [dropSound, setDropSound] = useState();
  const [celebrationSound, setCelebrationSound] = useState();
  
  // Ses dosyalarını yükle
  useEffect(() => {
    return () => {
      // Sayfa kapandığında sesleri temizle
      if (dropSound) dropSound.unloadAsync();
      if (celebrationSound) celebrationSound.unloadAsync();
    };
  }, [dropSound, celebrationSound]);
  
  // Su damlası sesi yükleme ve çalma
  const loadAndPlayDropSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/drop.mp3'),
        { volume: 0.6 }
      );
      setDropSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Ses çalınırken hata:', error);
    }
  };
  
  // Kutlama sesi yükleme ve çalma
  const loadAndPlayCelebrationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/celebration.mp3'),
        { volume: 0.8 }
      );
      setCelebrationSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Kutlama sesi çalınırken hata:', error);
    }
  };
  
  // Su tüketim hedefini kullanıcı verilerinden çek
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Kullanıcının su hedefi
        if (user?.user_metadata?.hydration?.targetAmount) {
          setDailyGoal(parseInt(user.user_metadata.hydration.targetAmount));
        } else if (user?.user_metadata?.dailyWaterGoal) {
          setDailyGoal(parseInt(user.user_metadata.dailyWaterGoal));
        }
        
        // Bugünkü su tüketimini yükle
        await loadWaterData();
      } catch (error) {
        console.error('Su verileri yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);
  
  // Su verilerini yükle
  const loadWaterData = async () => {
    try {
      // Bugünün tarihini al
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatı
      
      // Kaydedilmiş bugünkü su miktarını al
      const savedIntake = await AsyncStorage.getItem(`${STORAGE_KEYS.WATER_INTAKE}_${today}`);
      if (savedIntake) {
        try {
          const intakeAmount = parseInt(savedIntake);
          if (!isNaN(intakeAmount)) {
            setTotalIntake(intakeAmount);
            const progressValue = Math.min(intakeAmount / dailyGoal, 1);
            progressAnimation.value = withTiming(
              progressValue,
              { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
            );
          } else {
            // Geçersiz veri durumunda sıfırla
            console.warn('Geçersiz su miktarı verisi, sıfırlanıyor');
            setTotalIntake(0);
            progressAnimation.value = withTiming(0, { duration: 300 });
          }
        } catch (parseError) {
          console.error('Su miktarı ayrıştırma hatası:', parseError);
          setTotalIntake(0);
          progressAnimation.value = withTiming(0, { duration: 300 });
        }
      } else {
        // Veri yoksa sıfırla
        setTotalIntake(0);
        progressAnimation.value = withTiming(0, { duration: 300 });
      }
      
      // Su içme geçmişini al
      const savedHistory = await AsyncStorage.getItem(`${STORAGE_KEYS.WATER_HISTORY}_${today}`);
      if (savedHistory) {
        try {
          const historyData = JSON.parse(savedHistory);
          if (Array.isArray(historyData)) {
            setWaterHistory(historyData);
          } else {
            // Geçersiz veri durumunda boş dizi ile başla
            console.warn('Geçersiz su geçmişi verisi, sıfırlanıyor');
            setWaterHistory([]);
          }
        } catch (parseError) {
          console.error('Su geçmişi ayrıştırma hatası:', parseError);
          setWaterHistory([]);
        }
      } else {
        // Veri yoksa boş dizi ile başla
        setWaterHistory([]);
      }

      // Haftalık istatistikler için verileri yükle
      await loadWeeklyStats();
    } catch (error) {
      console.error('Su verileri yüklenirken hata:', error);
      // Hata durumunda varsayılan değerleri ayarla
      setTotalIntake(0);
      setWaterHistory([]);
      progressAnimation.value = withTiming(0, { duration: 300 });
    }
  };
  
  // Haftalık istatistikleri yükle
  const loadWeeklyStats = async () => {
    try {
      const today = new Date();
      const stats = [];
      
      // Son 7 günün verilerini al
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date);
        
        // O günün su tüketim miktarını al
        const savedIntake = await AsyncStorage.getItem(`${STORAGE_KEYS.WATER_INTAKE}_${dateStr}`);
        const intake = savedIntake ? parseInt(savedIntake) : 0;
        
        stats.push({
          date: dateStr,
          day: dayName,
          amount: intake,
          percentage: Math.min((intake / dailyGoal) * 100, 100).toFixed(0)
        });
      }
      
      setWeeklyStats(stats);
    } catch (error) {
      console.error('Haftalık istatistikler yüklenirken hata:', error);
      setWeeklyStats([]);
    }
  };
  
  // Su ekleme fonksiyonu
  const addWater = async (amount) => {
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Geçersiz su miktarı');
      return;
    }

    try {
      // Su ekleme sesi çal
      loadAndPlayDropSound();
      
      // Animasyon efekti
      waterDropAnimation.value = withSequence(
        withTiming(1.3, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
      
      addButtonScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1.1, { duration: 200 }),
        withTiming(1, { duration: 100 })
      );
      
      // Bugünün tarihini al
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date();
      const timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
      
      // Yeni toplam miktar
      const newTotal = totalIntake + amount;
      
      // Önce state'i güncelle
      setTotalIntake(newTotal);
      
      // Geçmiş için yeni öğe
      const newHistoryItem = {
        id: Date.now().toString(),
        amount,
        time: timeString,
        timestamp: currentTime.getTime(),
      };
      
      // Geçmiş listesi için yeni bir kopya oluştur
      const updatedHistory = [newHistoryItem, ...waterHistory];
      
      // State'i güncelle
      setWaterHistory(updatedHistory);
      
      // İlerleme barını güncelle
      const progressValue = Math.min(newTotal / dailyGoal, 1);
      progressAnimation.value = withTiming(
        progressValue,
        { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
      );
      
      // AsyncStorage'a kaydet (state güncellemelerinden sonra)
      await AsyncStorage.setItem(`${STORAGE_KEYS.WATER_INTAKE}_${today}`, newTotal.toString());
      await AsyncStorage.setItem(`${STORAGE_KEYS.WATER_HISTORY}_${today}`, JSON.stringify(updatedHistory));
      
      // Listeyi en üste kaydır
      if (historyListRef.current && updatedHistory.length > 1) {
        historyListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
      
      // Hedefe ulaşıldığında kutlama
      if (totalIntake < dailyGoal && newTotal >= dailyGoal) {
        // Kutlama sesi çal
        loadAndPlayCelebrationSound();
        
        // Konfeti animasyonunu başlat
        setShowConfetti(true);
        
        // Yüzde metnine pırıltı animasyonu ver
        progressTextScale.value = withSequence(
          withTiming(1.4, { duration: 300 }),
          withRepeat(
            withSequence(
              withTiming(1.2, { duration: 300 }),
              withTiming(1, { duration: 300 })
            ),
            3
          )
        );
        
        // Küçük bir gecikme ile kutlama alert'i
        setTimeout(() => {
          Alert.alert(
            "Tebrikler! 🎉",
            "Günlük su içme hedefinize ulaştınız! 💧",
            [{ text: "Teşekkürler!", style: "default" }]
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Su eklenirken hata:', error);
      // Hata durumunda kullanıcıya bilgi ver
      Alert.alert(
        "Hata",
        "Su eklenirken bir sorun oluştu, lütfen tekrar deneyin.",
        [{ text: "Tamam", style: "default" }]
      );
    }
  };
  
  // Konfeti efektini sıfırla
  const resetConfetti = () => {
    setShowConfetti(false);
  };
  
  // Temizleme fonksiyonu (geliştirme için)
  const resetData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.removeItem(`${STORAGE_KEYS.WATER_INTAKE}_${today}`);
      await AsyncStorage.removeItem(`${STORAGE_KEYS.WATER_HISTORY}_${today}`);
      setTotalIntake(0);
      setWaterHistory([]);
      progressAnimation.value = withTiming(0, { duration: 500 });
      Alert.alert("Sıfırlandı", "Bugünkü su kayıtları temizlendi.");
    } catch (error) {
      console.error('Veriler sıfırlanırken hata:', error);
    }
  };
  
  // Animasyon stilleri
  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(progressAnimation.value, [0, 1], [0, 100])}%`,
    };
  });
  
  const waterDropStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: waterDropAnimation.value }],
    };
  });
  
  const addButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: addButtonScale.value }],
    };
  });
  
  const progressTextStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: progressTextScale.value }],
      color: interpolate(
        progressAnimation.value,
        [0, 0.5, 1],
        ['#3B82F6', '#3B82F6', '#10B981']
      )
    };
  });
  
  // Su kayıtlarını silme fonksiyonu
  const deleteWaterEntry = async (itemId) => {
    try {
      Alert.alert(
        "Su Kaydını Sil",
        "Bu su kaydını silmek istediğinize emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          { 
            text: "Sil", 
            style: "destructive",
            onPress: async () => {
              // Bugünün tarihini al
              const today = new Date().toISOString().split('T')[0];
              
              // Silinecek kaydı bul
              const itemToDelete = waterHistory.find(item => item.id === itemId);
              if (!itemToDelete) return;
              
              // Toplam su miktarından çıkar
              const newTotal = Math.max(totalIntake - itemToDelete.amount, 0);
              setTotalIntake(newTotal);
              
              // Güncellenen geçmişi oluştur
              const updatedHistory = waterHistory.filter(item => item.id !== itemId);
              setWaterHistory(updatedHistory);
              
              // İlerleme çubuğunu güncelle
              const progressValue = Math.min(newTotal / dailyGoal, 1);
              progressAnimation.value = withTiming(
                progressValue,
                { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
              );
              
              // Verileri kaydet
              await AsyncStorage.setItem(`${STORAGE_KEYS.WATER_INTAKE}_${today}`, newTotal.toString());
              await AsyncStorage.setItem(`${STORAGE_KEYS.WATER_HISTORY}_${today}`, JSON.stringify(updatedHistory));
            }
          }
        ]
      );
    } catch (error) {
      console.error('Su kaydı silinirken hata:', error);
      Alert.alert("Hata", "Kayıt silinirken bir sorun oluştu.");
    }
  };
  
  // Su içme geçmişindeki bir öğeyi render et
  const renderHistoryItem = ({ item, index }) => (
    <Animated.View 
      entering={FadeIn.delay(index * 100).duration(300)}
      style={styles.historyItem}
    >
      <View style={styles.historyItemLeft}>
        <MaterialCommunityIcons name="cup-water" size={24} color="#3B82F6" />
        <View style={styles.historyItemInfo}>
          <Text style={styles.historyItemAmount}>{item.amount} ml</Text>
          <Text style={styles.historyItemTime}>{item.time}</Text>
        </View>
      </View>
      <View style={styles.historyItemRightContainer}>
        <View style={styles.historyItemBadge}>
          <Text style={styles.historyItemBadgeText}>+{item.amount}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteWaterEntry(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
  
  // Miktarı formatlama
  const formatWaterAmount = (ml) => {
    return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${ml} ml`;
  };
  
  // Hedefe kalan miktarı hesapla
  const getRemainingAmount = () => {
    const remaining = dailyGoal - totalIntake;
    return remaining > 0 ? remaining : 0;
  };
  
  // İlerleme yüzdesini hesapla
  const getProgressPercentage = () => {
    const percentage = (totalIntake / dailyGoal) * 100;
    return Math.min(percentage, 100).toFixed(0);
  };

  // Haftalık istatistiklerdeki bir günü render et
  const renderWeeklyStatsItem = ({ item }) => (
    <View style={styles.weeklyStatsItem}>
      <Text style={styles.weeklyStatsDay}>{item.day}</Text>
      <View style={styles.weeklyStatsBarContainer}>
        <View 
          style={[
            styles.weeklyStatsBar, 
            { height: `${item.percentage}%` },
            parseFloat(item.percentage) >= 100 ? styles.weeklyStatsBarComplete : {}
          ]} 
        />
      </View>
      <Text style={styles.weeklyStatsAmount}>{formatWaterAmount(item.amount)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Başlık */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Su Takibi</Text>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => setShowDetailsModal(true)}
        >
          <Ionicons name="stats-chart" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>
      
      {/* Konfeti efekti */}
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
          autoStart={true}
          fadeOut={true}
          fallSpeed={3000}
          explosionSpeed={350}
          colors={['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#2563EB']}
          onAnimationEnd={resetConfetti}
        />
      )}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* İlerleme Bölümü */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <Animated.View style={waterDropStyle}>
              <MaterialCommunityIcons name="water" size={70} color="#3B82F6" style={styles.waterIcon} />
            </Animated.View>
            
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Günlük Su Takibi</Text>
              <Animated.Text style={[styles.progressPercentage, progressTextStyle]}>
                {getProgressPercentage()}%
              </Animated.Text>
              
              <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBar, progressBarStyle]} />
              </View>
              
              <View style={styles.amountInfo}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountValue}>{formatWaterAmount(totalIntake)}</Text>
                  <Text style={styles.amountLabel}>İçilen</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountItem}>
                  <Text style={styles.amountValue}>{formatWaterAmount(dailyGoal)}</Text>
                  <Text style={styles.amountLabel}>Hedef</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountItem}>
                  <Text style={styles.amountValue}>{formatWaterAmount(getRemainingAmount())}</Text>
                  <Text style={styles.amountLabel}>Kalan</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Su Ekleme Bölümü */}
        <View style={styles.addSection}>
          <Text style={styles.sectionTitle}>Miktar Seçin</Text>
          
          <View style={styles.amountOptions}>
            {WATER_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountOption,
                  selectedAmount === amount && styles.amountOptionSelected
                ]}
                onPress={() => setSelectedAmount(amount)}
              >
                <Text 
                  style={[
                    styles.amountOptionText,
                    selectedAmount === amount && styles.amountOptionTextSelected
                  ]}
                >
                  {amount} ml
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Animated.View style={[styles.addButtonContainer, addButtonStyle]}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addWater(selectedAmount)}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Su Ekle</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Geçmiş Bölümü */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Bugünkü Su İçme Geçmişi</Text>
          
          {waterHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <MaterialCommunityIcons name="cup-water" size={40} color="#D1D5DB" />
              <Text style={styles.emptyHistoryText}>Henüz su eklemesi yapmadınız</Text>
              <Text style={styles.emptyHistorySubtext}>Su içtikçe burada görünecek</Text>
            </View>
          ) : (
            <FlatList
              ref={historyListRef}
              data={waterHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              style={styles.historyList}
              contentContainerStyle={styles.historyContent}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyHistory}>
                  <MaterialCommunityIcons name="cup-water" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyHistoryText}>Henüz su eklemesi yapmadınız</Text>
                  <Text style={styles.emptyHistorySubtext}>Su içtikçe burada görünecek</Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Detaylı Su Tüketimi Tablosu Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Su Tüketim Detayları</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Günlük Özet */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Günlük Özet</Text>
                <View style={styles.dailySummaryContainer}>
                  <View style={styles.dailySummaryItem}>
                    <Text style={styles.dailySummaryValue}>{formatWaterAmount(totalIntake)}</Text>
                    <Text style={styles.dailySummaryLabel}>Bugünkü Miktar</Text>
                  </View>
                  <View style={styles.dailySummaryItem}>
                    <Text style={styles.dailySummaryValue}>{getProgressPercentage()}%</Text>
                    <Text style={styles.dailySummaryLabel}>Hedefin</Text>
                  </View>
                  <View style={styles.dailySummaryItem}>
                    <Text style={styles.dailySummaryValue}>{waterHistory.length}</Text>
                    <Text style={styles.dailySummaryLabel}>Toplam Su</Text>
                  </View>
                </View>
              </View>
              
              {/* Haftalık İstatistikler */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Haftalık İstatistikler</Text>
                <View style={styles.weeklyStatsContainer}>
                  {weeklyStats.map((item, index) => (
                    <View key={index} style={styles.weeklyStatsItem}>
                      <Text style={styles.weeklyStatsDay}>{item.day}</Text>
                      <View style={styles.weeklyStatsBarContainer}>
                        <View 
                          style={[
                            styles.weeklyStatsBar, 
                            { height: `${item.percentage}%` },
                            parseFloat(item.percentage) >= 100 ? styles.weeklyStatsBarComplete : {}
                          ]} 
                        />
                      </View>
                      <Text style={styles.weeklyStatsAmount}>{formatWaterAmount(item.amount)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.weeklyStatsLegend}>
                  <Text style={styles.weeklyStatsLegendText}>
                    Günlük Hedef: {formatWaterAmount(dailyGoal)}
                  </Text>
                </View>
              </View>
              
              {/* İpuçları */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Su İçme İpuçları</Text>
                <View style={styles.tipContainer}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name="water-outline" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Sabah Rutini</Text>
                    <Text style={styles.tipText}>Güne bir bardak su ile başlayın.</Text>
                  </View>
                </View>
                <View style={styles.tipContainer}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name="time-outline" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Hatırlatıcılar</Text>
                    <Text style={styles.tipText}>Her saat başı bir bardak su için.</Text>
                  </View>
                </View>
                <View style={styles.tipContainer}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name="restaurant-outline" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Yemek Zamanları</Text>
                    <Text style={styles.tipText}>Her öğünden önce bir bardak su için.</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={() => {
                    setShowDetailsModal(false);
                    setTimeout(() => resetData(), 300);
                  }}
                >
                  <Text style={styles.resetButtonText}>Su Verilerini Sıfırla</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    padding: 4,
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  progressSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  progressContainer: {
    alignItems: 'center',
  },
  waterIcon: {
    marginBottom: 16,
  },
  progressInfo: {
    width: '100%',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  amountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  addSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  amountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  amountOption: {
    width: '18%',
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  amountOptionText: {
    fontSize: 14,
    color: '#4B5563',
  },
  amountOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  addButtonContainer: {
    width: '100%',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  historySection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyList: {
    marginTop: 8,
  },
  historyContent: {
    paddingBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemInfo: {
    marginLeft: 12,
  },
  historyItemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  historyItemTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyItemRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
  },
  historyItemBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 24,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  modalSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  dailySummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailySummaryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  dailySummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  dailySummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  weeklyStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: 16,
  },
  weeklyStatsItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  weeklyStatsDay: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  weeklyStatsBarContainer: {
    width: 16,
    height: '70%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  weeklyStatsBar: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  weeklyStatsBarComplete: {
    backgroundColor: '#10B981',
  },
  weeklyStatsAmount: {
    fontSize: 10,
    color: '#6B7280',
  },
  weeklyStatsLegend: {
    alignItems: 'center',
    marginTop: 8,
  },
  weeklyStatsLegendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalFooter: {
    padding: 24,
  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
}); 