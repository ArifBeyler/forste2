import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useCalendar } from '../context/CalendarContext';

const { width, height } = Dimensions.get('window');

interface PomodoroTimer {
  id: string;
  name: string;
  duration: number; // dakika cinsinden
  type: 'focus' | 'short_break' | 'long_break';
}

interface SoundOption {
  id: string;
  name: string;
  icon: string;
}

interface Task {
  id: string;
  title: string;
  dueDate?: Date;
  category?: string;
  isCompleted?: boolean;
}

// Süre seçenekleri
const TIMER_DURATIONS = [
  { id: '5min', name: '5 min', duration: 5 },
  { id: '10min', name: '10 min', duration: 10 },
  { id: '15min', name: '15 min', duration: 15 },
  { id: '25min', name: '25 min', duration: 25 },
  { id: '30min', name: '30 min', duration: 30 },
  { id: '60min', name: '60 min', duration: 60 },
];

// Ses seçenekleri
const SOUND_OPTIONS: SoundOption[] = [
  { id: 'silent', name: 'Silent', icon: 'volume-off' },
  { id: 'whitenoise', name: 'White Noise', icon: 'waves' },
  { id: 'rain', name: 'Rain', icon: 'umbrella' },
  { id: 'forest', name: 'Forest', icon: 'forest' },
  { id: 'cafe', name: 'Cafe', icon: 'coffee' },
  { id: 'fireplace', name: 'Fireplace', icon: 'local-fire-department' },
];

const TIMER_MODES = [
  { id: 'strict', name: 'Strict Mode', icon: 'alert-circle-outline' },
  { id: 'timer', name: 'Timer Mode', icon: 'hourglass-outline' },
  { id: 'sound', name: 'White Noise', icon: 'musical-notes-outline' }
];

// Kategori türlerinin Türkçe karşılıkları
const CATEGORY_LABELS = {
  'personal_dev': 'Kişisel Gelişim',
  'sport': 'Spor',
  'work': 'İş / Üretkenlik',
  'relationship': 'İlişkisel',
  'todo': 'Yapılacak',
  'meeting': 'Toplantı',
  'review': 'İnceleme',
  'sketch': 'Taslak',
  'default': 'Kategori'
};

// Ana bileşen - dışarıdan erişilebilir
export default function FocusScreenWrapper({ navigation }: { navigation?: any }) {
  return (
    <FocusScreenContent navigation={navigation} />
  );
}

// İçerik bileşeni - context'i kullanan asıl ekran
function FocusScreenContent({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  
  // Calendar Context'ten verileri al
  const { activeEvents, todos } = useCalendar();
  
  // Durum
  const [activeTimer, setActiveTimer] = useState<PomodoroTimer>({
    id: 'short_break',
    name: 'Short Break',
    duration: 5,
    type: 'short_break'
  });
  const [timeLeft, setTimeLeft] = useState(activeTimer.duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState('5min');
  const [selectedSound, setSelectedSound] = useState('silent');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [modeModalVisible, setModeModalVisible] = useState(false);
  const [timerMode, setTimerMode] = useState<'countdown' | 'unlimited'>('countdown');
  const [showCongrats, setShowCongrats] = useState(false);
  
  // Animasyon değerleri
  const buttonScaleAnimation = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  // Timer değiştiğinde zamanı güncelle ve mesajı ayarla
  useEffect(() => {
    setTimeLeft(activeTimer.duration * 60);
  }, [activeTimer]);
  
  // İlerleme animasyonu
  useEffect(() => {
    if (isActive) {
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: activeTimer.duration * 60 * 1000,
        useNativeDriver: false
      }).start();
    } else {
      progressAnimation.setValue(0);
    }
  }, [isActive, activeTimer.duration]);
  
  // Zamanlayıcı efekti - süreyi azalt
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            if (interval) clearInterval(interval);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);
  
  // Progress değerini hesapla
  const progress = useMemo(() => {
    const totalTime = activeTimer.duration * 60;
    return isActive ? 1 - (timeLeft / totalTime) : 0;
  }, [timeLeft, activeTimer.duration, isActive]);
  
  // Timer tamamlandığında
  const handleTimerComplete = useCallback(() => {
    setIsActive(false);
    setCompletedSessions(prev => prev + 1);
    setShowCongrats(true);
    // Ses çal veya bildirim göster
  }, []);
  
  // Zamanı formatla
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Başlat/Duraklat buton animasyonu
  const animateButton = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: false
      }),
      Animated.timing(buttonScaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false
      })
    ]).start();
  }, [buttonScaleAnimation]);
  
  // Zamanlayıcıyı başlat/durdur/bitir
  const toggleTimer = useCallback(() => {
    animateButton();
    if (!isActive && isPaused) {
      // Devam Et
      setIsActive(true);
      setIsPaused(false);
      return;
    }
    if (!isActive && !isPaused) {
      // İlk kez başlat
      setIsActive(true);
      setIsPaused(false);
      return;
    }
    if (isActive) {
      // Bitir
      setIsActive(false);
      setIsPaused(false);
      setTimeLeft(activeTimer.duration * 60);
      setShowCongrats(true);
      return;
    }
  }, [isActive, isPaused, animateButton, activeTimer.duration]);

  // Durdur butonu
  const handlePause = useCallback(() => {
    setIsActive(false);
    setIsPaused(true);
  }, []);

  // Sıfırla butonu
  const handleReset = useCallback(() => {
    setTimeLeft(activeTimer.duration * 60);
    setIsActive(false);
    setIsPaused(false);
    progressAnimation.setValue(0);
  }, [activeTimer.duration, progressAnimation]);
  
  // Modu değiştir
  const toggleMode = useCallback((modeId: string) => {
    setSelectedMode(prev => prev === modeId ? null : modeId);
  }, []);
  
  // Görev seçici modalini aç
  const openTaskModal = useCallback(() => {
    setTaskModalVisible(true);
  }, []);
  
  // Görev seç
  const selectTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setTaskModalVisible(false);
  }, []);
  
  // Görevi temizle
  const clearTask = useCallback(() => {
    setSelectedTask(null);
    setTaskModalVisible(false);
  }, []);
  
  // Süreyi değiştir
  const handleDurationSelect = useCallback((durationId: string) => {
    setSelectedDuration(durationId);
    
    // Seçilen süreyi bul
    const selectedOption = TIMER_DURATIONS.find(option => option.id === durationId);
    if (selectedOption) {
      setActiveTimer(prev => ({
        ...prev,
        duration: selectedOption.duration
      }));
    }
  }, []);
  
  // Sesi değiştir
  const handleSoundSelect = useCallback((soundId: string) => {
    setSelectedSound(soundId);
    // Burada ses oynatma mantığı eklenebilir
  }, []);
  
  // Circle çemberlerinin ölçüleri
  const CIRCLE_LENGTH = width * 0.75 * Math.PI * 0.8; // 80% çap için
  const CIRCLE_RADIUS = width * 0.3;
  const CIRCLE_THICKNESS = 25; // Daha kalın halka
  
  // Stroke dash offset hesapla (progress'i temsil eder)
  const strokeDashoffset = CIRCLE_LENGTH * (1 - progress);
  
  // Calendar verilerinden task listesi oluştur
  const allTasks = useMemo(() => {
    const tasks: Task[] = [];
    
    // Etkinlikleri ekle
    if (activeEvents && Array.isArray(activeEvents)) {
      activeEvents.forEach(event => {
        tasks.push({
          id: event.id,
          title: event.title,
          dueDate: event.date ? new Date(event.date) : undefined,
          category: event.type,
          isCompleted: false
        });
      });
    }
    
    // Yapılacakları ekle
    if (todos && Array.isArray(todos)) {
      todos.forEach(todo => {
        tasks.push({
          id: todo.id,
          title: todo.title,
          dueDate: todo.date ? new Date(todo.date) : undefined,
          category: 'todo',
          isCompleted: todo.completed
        });
      });
    }
    
    return tasks;
  }, [activeEvents, todos]);
  
  // Kategori adını formatla
  const formatCategoryName = useCallback((category: string | undefined): string => {
    if (!category) return CATEGORY_LABELS.default;
    return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
  }, []);
  
  // En yakın görevi hesapla
  const nearestTask = useMemo(() => {
    if (allTasks.length === 0) return null;
    
    // Tarihe göre sırala
    const taskWithDueDates = allTasks.filter(task => task.dueDate);
    if (taskWithDueDates.length === 0) return null;
    
    const sortedTasks = [...taskWithDueDates].sort((a, b) => {
      const aTime = a.dueDate ? a.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? b.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
    
    return sortedTasks[0];
  }, [allTasks]);
  
  // Görüntülenecek görevi seç
  const displayedTask = selectedTask || nearestTask;
  
  // Görev metni
  const taskDisplayText = displayedTask ? displayedTask.title : 'Odaklanmam gerek';
  
  if (showCongrats) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ConfettiCannon count={120} origin={{x: width/2, y: 0}} fadeOut={true} explosionSpeed={350} fallSpeed={3000} />
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          {/* Kupa SVG veya PNG */}
          <Ionicons name="trophy" size={120} color="#FFB800" style={{ marginBottom: 24 }} />
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#222', marginBottom: 12 }}>Tebrikler!</Text>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 32 }}>
            Odaklanma süreni başarıyla tamamladın.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#FF5A5A', borderRadius: 24, paddingVertical: 16, paddingHorizontal: 36 }}
            onPress={() => { setShowCongrats(false); navigation?.navigate('Focus'); }}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Focus ekranına dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Üst başlık */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation?.navigate('Home')}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Odaklan</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Görev Seçici */}
      <View style={styles.taskContainer}>
        <TouchableOpacity 
          style={styles.taskSelectorButton}
          onPress={openTaskModal}
        >
          <Text style={styles.taskSelectorText}>
            {taskDisplayText}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      {/* Ana Beyaz Bölge */}
      <View style={styles.whiteContainer}>
        {/* Zamanlayıcı dairesi */}
        <View style={styles.timerContainer}>
          <View style={styles.timerCircleOuter}>
            <Svg width={width * 0.75} height={width * 0.75} style={styles.svg}>
              {/* Background Circle - daha açık renkli arka plan */}
              <Circle
                cx={width * 0.375}
                cy={width * 0.375}
                r={CIRCLE_RADIUS}
                strokeWidth={CIRCLE_THICKNESS}
                stroke="rgba(255, 90, 90, 0.1)" 
                fill="transparent"
              />
              
              {/* Foreground Circle (Progress) - sabit progress halkası */}
              <Circle
                cx={width * 0.375}
                cy={width * 0.375}
                r={CIRCLE_RADIUS}
                strokeWidth={CIRCLE_THICKNESS}
                stroke="#FF5A5A"
                fill="transparent"
                strokeDasharray={CIRCLE_LENGTH}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </Svg>
            
            <View style={styles.timerTextContainer}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerLabel}>{activeTimer.name}</Text>
            </View>
          </View>
        </View>
        
        {/* Timer'ın hemen altına butonlar */}
        <View style={styles.timerButtonRow}>
          <TouchableOpacity style={styles.sideButton} onPress={handlePause}>
            <Ionicons name="pause" size={22} color="#FF5A5A" />
            <Text style={styles.sideButtonText}>Durdur</Text>
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: buttonScaleAnimation }] }}>
            <TouchableOpacity 
              style={[styles.startButton, (isActive || isPaused) && styles.stopButton]}
              onPress={toggleTimer}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={
                  !isActive && isPaused ? "play" :
                  isActive ? "stop" : "play"
                }
                size={24} 
                color="#FFF" 
                style={styles.startButtonIcon} 
              />
              <Text style={styles.startButtonText}>
                {
                  !isActive && isPaused ? 'Devam Et' :
                  isActive ? 'Bitir' : 'Başlat'
                }
              </Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity style={styles.sideButton} onPress={handleReset}>
            <Ionicons name="refresh" size={22} color="#FF5A5A" />
            <Text style={styles.sideButtonText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>
        {/* Üç kutu: Süre, Ses, Mod */}
        <View style={styles.lContainer}>
          <TouchableOpacity style={styles.lDropdown} onPress={() => setDurationModalVisible(true)}>
            <Text style={styles.lDropdownLabel}>Süre</Text>
            <Text style={styles.lDropdownValue}>{TIMER_DURATIONS.find(d => d.id === selectedDuration)?.name}</Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" style={{ position: 'absolute', right: 12, top: 18 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.lDropdown} onPress={() => setSoundModalVisible(true)}>
            <Text style={styles.lDropdownLabel}>Ses</Text>
            <Text style={styles.lDropdownValue}>{SOUND_OPTIONS.find(s => s.id === selectedSound)?.name}</Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" style={{ position: 'absolute', right: 12, top: 18 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.lDropdown} onPress={() => setModeModalVisible(true)}>
            <Text style={styles.lDropdownLabel}>Mod</Text>
            <Text style={styles.lDropdownValue}>{timerMode === 'countdown' ? 'Süreli' : 'Sınırsız'}</Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" style={{ position: 'absolute', right: 12, top: 18 }} />
          </TouchableOpacity>
        </View>
        
        {/* Duration Modal */}
        <Modal
          visible={durationModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDurationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.lModalContent}>
              <Text style={styles.lModalTitle}>Süre Seç</Text>
              {TIMER_DURATIONS.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.lModalOption, selectedDuration === option.id && styles.lModalOptionSelected]}
                  onPress={() => { setSelectedDuration(option.id); setActiveTimer(prev => ({ ...prev, duration: option.duration })); setDurationModalVisible(false); }}
                >
                  <Text style={[styles.lModalOptionText, selectedDuration === option.id && styles.lModalOptionTextSelected]}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
        {/* Sound Modal */}
        <Modal
          visible={soundModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSoundModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.lModalContent}>
              <Text style={styles.lModalTitle}>Ses Seç</Text>
              {SOUND_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.lModalOption, selectedSound === option.id && styles.lModalOptionSelected]}
                  onPress={() => { setSelectedSound(option.id); setSoundModalVisible(false); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name={option.icon as any} size={22} color={selectedSound === option.id ? '#FF5A5A' : '#666'} />
                    <Text style={[styles.lModalOptionText, selectedSound === option.id && styles.lModalOptionTextSelected, { marginLeft: 8 }]}>{option.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
        
        {/* Timer Mode Modal */}
        <Modal
          visible={modeModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modeModalContent}>
              <Text style={styles.modeModalTitle}>Zamanlayıcı Modu</Text>
              <View style={styles.modeModalOptionGroup}>
                <TouchableOpacity
                  style={styles.modeModalOption}
                  onPress={() => setTimerMode('countdown')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.modeModalOptionTime}>25:00 → 00:00</Text>
                    {timerMode === 'countdown' && <Ionicons name="checkmark" size={22} color="#FF5A5A" style={{ marginLeft: 8 }} />}
                  </View>
                  <Text style={styles.modeModalOptionDesc}>Süre dolana kadar 25 dakikadan geriye sayar.</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modeModalOption}
                  onPress={() => setTimerMode('unlimited')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.modeModalOptionTime}>00:00 → ∞</Text>
                    {timerMode === 'unlimited' && <Ionicons name="checkmark" size={22} color="#FF5A5A" style={{ marginLeft: 8 }} />}
                  </View>
                  <Text style={styles.modeModalOptionDesc}>Manuel durdurulana kadar 0'dan ileriye sayar.</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modeModalButtonRow}>
                <TouchableOpacity style={styles.modeModalCancelButton} onPress={() => setModeModalVisible(false)}>
                  <Text style={styles.modeModalCancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modeModalOkButton} onPress={() => setModeModalVisible(false)}>
                  <Text style={styles.modeModalOkText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      
      {/* Görev Seçici Modal */}
      <Modal
        visible={taskModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Görevleriniz</Text>
              <TouchableOpacity onPress={() => setTaskModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={allTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.taskItem,
                    selectedTask?.id === item.id && styles.selectedTaskItem
                  ]}
                  onPress={() => selectTask(item)}
                >
                  <View style={styles.taskItemContent}>
                    <View>
                      <Text style={styles.taskItemTitle}>{item.title}</Text>
                      {item.category && (
                        <Text style={styles.taskItemCategory}>
                          {formatCategoryName(item.category)}
                        </Text>
                      )}
                    </View>
                    {item.dueDate && (
                      <Text style={styles.taskItemDue}>
                        {item.dueDate.toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </Text>
                    )}
                  </View>
                  {selectedTask?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#FF5A5A" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyTasksContainer}>
                  <Text style={styles.emptyTasksText}>
                    Henüz görev veya etkinlik eklenmemiş
                  </Text>
                </View>
              }
              ListFooterComponent={
                <TouchableOpacity 
                  style={[
                    styles.taskItem,
                    styles.defaultTaskItem,
                    !selectedTask && styles.selectedTaskItem
                  ]}
                  onPress={clearTask}
                >
                  <Text style={styles.defaultTaskText}>Odaklanmam gerek</Text>
                  {!selectedTask && (
                    <Ionicons name="checkmark-circle" size={20} color="#FF5A5A" />
                  )}
                </TouchableOpacity>
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.taskListContent}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Animated Circle bileşeni
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF5A5A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerButton: {
    padding: 4,
  },
  taskContainer: {
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 20,
  },
  taskSelectorButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  taskSelectorText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  timerCircleOuter: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  timerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 54,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 5,
  },
  timerLabel: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  lContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  lDropdown: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginHorizontal: 5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    position: 'relative',
    minHeight: 60,
  },
  lDropdownLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  lDropdownValue: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
  },
  lButtonContainer: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 10,
  },
  lModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 60,
  },
  lModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  lModalOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  lModalOptionSelected: {
    backgroundColor: '#FEE2E2',
  },
  lModalOptionText: {
    fontSize: 16,
    color: '#4B5563',
  },
  lModalOptionTextSelected: {
    color: '#FF5A5A',
    fontWeight: '600',
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 'auto',
    width: '100%',
  },
  modeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modeText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  modeTextSelected: {
    color: '#FF5A5A',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.7,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  taskItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTaskItem: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  taskItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskItemTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  taskItemCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  taskItemDue: {
    fontSize: 14,
    color: '#FF5A5A',
    fontWeight: '500',
  },
  defaultTaskItem: {
    backgroundColor: '#F3F4F6',
    marginTop: 10,
  },
  defaultTaskText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  taskListContent: {
    paddingBottom: 20,
  },
  emptyTasksContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyTasksText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontStyle: 'italic',
  },
  modeModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 60,
  },
  modeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 18,
  },
  modeModalOptionGroup: {
    marginBottom: 24,
  },
  modeModalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modeModalOptionTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  modeModalOptionDesc: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    marginLeft: 2,
  },
  modeModalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modeModalCancelButton: {
    flex: 1,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    paddingVertical: 14,
    marginRight: 8,
    alignItems: 'center',
  },
  modeModalOkButton: {
    flex: 1,
    backgroundColor: '#FF5A5A',
    borderRadius: 16,
    paddingVertical: 14,
    marginLeft: 8,
    alignItems: 'center',
  },
  modeModalCancelText: {
    color: '#FF5A5A',
    fontSize: 16,
    fontWeight: '600',
  },
  modeModalOkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timerButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sideButton: {
    flex: 1,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sideButtonText: {
    color: '#FF5A5A',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  startButton: {
    backgroundColor: '#FF5A5A',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5A5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stopButton: {
    backgroundColor: '#F59E42',
  },
  startButtonIcon: {
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
}); 