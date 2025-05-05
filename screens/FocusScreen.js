import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FocusScreen() {
  // Zamanlayıcı durumu
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 dakika (saniye cinsinden)
  const [currentSession, setCurrentSession] = useState('Çalışma');
  const [completedSessions, setCompletedSessions] = useState(0);
  
  // Günlük istatistikler
  const stats = {
    todayFocus: '2 saat 15 dakika',
    sessionsCompleted: 4,
    longestStreak: '45 dakika',
  };
  
  // Örnek görevler
  const tasks = [
    { id: 1, title: 'E-postaları kontrol et', completed: true },
    { id: 2, title: 'Proje sunumunu hazırla', completed: false },
    { id: 3, title: 'Toplantı notlarını gözden geçir', completed: false },
    { id: 4, title: 'Uygulama prototipi tamamla', completed: false },
  ];
  
  // Zamanlayıcı efekti
  useEffect(() => {
    let interval = null;
    
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            clearInterval(interval);
            handleSessionComplete();
            return 0;
          }
          return timeLeft - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft]);
  
  // Seans tamamlandığında
  const handleSessionComplete = () => {
    setIsActive(false);
    setIsPaused(false);
    
    // Ses çalabilir veya bildirim gösterebilir
    
    if (currentSession === 'Çalışma') {
      setCompletedSessions(completedSessions + 1);
      setCurrentSession('Mola');
      setTimeLeft(5 * 60); // 5 dakika mola
    } else {
      setCurrentSession('Çalışma');
      setTimeLeft(25 * 60); // 25 dakika çalışma
    }
  };
  
  // Başlat/Durdur
  const handleStartStop = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
    } else {
      setIsActive(false);
    }
  };
  
  // Duraklat/Devam
  const handlePause = () => {
    setIsPaused(!isPaused);
  };
  
  // Sıfırla
  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(currentSession === 'Çalışma' ? 25 * 60 : 5 * 60);
  };
  
  // Zamanı formatla
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Tamamlanma yüzdesini hesapla
  const calculateProgress = () => {
    const totalTime = currentSession === 'Çalışma' ? 25 * 60 : 5 * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Üst başlık */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Focus</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="settings-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.content}>
          {/* Ana odak zamanlayıcısı */}
          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <Text style={styles.timerTitle}>Pomodoro Tekniği</Text>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timerCircle}>
              <Text style={styles.timerValue}>25:00</Text>
            </View>
            
            <View style={styles.timerControls}>
              <TouchableOpacity style={styles.timerButton}>
                <Ionicons name="play" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetButton}>
                <Ionicons name="refresh" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>4</Text>
                <Text style={styles.statLabel}>Setler</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Dakika Mola</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>15</Text>
                <Text style={styles.statLabel}>Uzun Mola</Text>
              </View>
            </View>
          </View>
          
          {/* Odak modu seçimi */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Odak Modları</Text>
          </View>
          
          <View style={styles.focusModes}>
            <TouchableOpacity style={[styles.modeCard, styles.activeMode]}>
              <View style={styles.modeIcon}>
                <Ionicons name="timer-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modeName}>Pomodoro</Text>
              <Text style={styles.modeDesc}>25-5-25-5-25-15</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modeCard}>
              <View style={[styles.modeIcon, styles.deepWorkIcon]}>
                <Ionicons name="flash-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modeName}>Derin Çalışma</Text>
              <Text style={styles.modeDesc}>50-10-50-10</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modeCard}>
              <View style={[styles.modeIcon, styles.shortBreakIcon]}>
                <Ionicons name="cafe-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modeName}>Kısa Molalar</Text>
              <Text style={styles.modeDesc}>15-5-15-5</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modeCard}>
              <View style={[styles.modeIcon, styles.customIcon]}>
                <Ionicons name="options-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modeName}>Özel</Text>
              <Text style={styles.modeDesc}>Siz ayarlayın</Text>
            </TouchableOpacity>
          </View>
          
          {/* Geçmiş istatistikler */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>İstatistikler</Text>
          </View>
          
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>12</Text>
                <Text style={styles.statsLabel}>Bugün</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>48</Text>
                <Text style={styles.statsLabel}>Hafta</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>182</Text>
                <Text style={styles.statsLabel}>Ay</Text>
              </View>
            </View>
            
            <View style={styles.statsBar}>
              <View style={styles.statsBarInner} />
            </View>
            
            <Text style={styles.statsBarLabel}>Haftalık hedefin %60'ı tamamlandı</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  timerCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoButton: {
    padding: 4,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  timerValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  timerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  resetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  focusModes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  modeCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeMode: {
    backgroundColor: '#7C3AED',
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modeDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsCard: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsBar: {
    height: 10,
    backgroundColor: '#EDE9FE',
    borderRadius: 5,
    marginBottom: 8,
  },
  statsBarInner: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 5,
  },
  statsBarLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
}); 