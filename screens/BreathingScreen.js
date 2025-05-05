import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function BreathingScreen({ navigation }) {
  // Nefes alma durumları: 'idle', 'inhale', 'hold', 'exhale'
  const [breathingState, setBreathingState] = useState('idle');
  const [sessionActive, setSessionActive] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState('4-7-8');
  
  // Animasyon değerleri
  const circleSize = useRef(new Animated.Value(1)).current;
  const circleOpacity = useRef(new Animated.Value(0.3)).current;
  
  // Zamanlayıcı
  const timerRef = useRef(null);
  
  // Egzersiz presetleri
  const exercises = {
    '4-7-8': {
      name: '4-7-8 Tekniği',
      description: '4 saniye nefes al, 7 saniye tut, 8 saniye ver',
      inhaleTime: 4000,
      holdTime: 7000,
      exhaleTime: 8000,
      color: '#8B5CF6',
    },
    'box': {
      name: 'Kare Nefes',
      description: '4 saniye nefes al, 4 saniye tut, 4 saniye ver, 4 saniye bekle',
      inhaleTime: 4000,
      holdTime: 4000,
      exhaleTime: 4000,
      pauseTime: 4000,
      color: '#3B82F6',
    },
    'calm': {
      name: 'Sakinleştirici Nefes',
      description: '6 saniye nefes al, 2 saniye tut, 7 saniye ver',
      inhaleTime: 6000,
      holdTime: 2000,
      exhaleTime: 7000,
      color: '#10B981',
    },
  };
  
  // Şu anki egzersiz
  const currentExercise = exercises[selectedExercise];
  
  // Nefes alma durumuna göre mesajı belirle
  const getInstructionMessage = () => {
    switch (breathingState) {
      case 'inhale':
        return 'Nefes Al';
      case 'hold':
        return 'Tut';
      case 'exhale':
        return 'Nefes Ver';
      case 'pause':
        return 'Bekle';
      default:
        return 'Başlamak için hazır mısın?';
    }
  };
  
  // Nefes alma/verme animasyonları
  const animateCircle = (toValue, duration) => {
    Animated.timing(circleSize, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(circleOpacity, {
      toValue: toValue === 2 ? 0.7 : 0.3,
      duration,
      useNativeDriver: true,
    }).start();
  };
  
  // Nefes alma döngüsü
  const startBreathingCycle = () => {
    setSessionActive(true);
    
    // Nefes alma
    setBreathingState('inhale');
    animateCircle(2, currentExercise.inhaleTime);
    
    timerRef.current = setTimeout(() => {
      // Nefes tutma
      setBreathingState('hold');
      
      timerRef.current = setTimeout(() => {
        // Nefes verme
        setBreathingState('exhale');
        animateCircle(1, currentExercise.exhaleTime);
        
        timerRef.current = setTimeout(() => {
          // Eğer beklemek gerekiyorsa (kare nefes için)
          if (currentExercise.pauseTime) {
            setBreathingState('pause');
            
            timerRef.current = setTimeout(() => {
              setBreathCount(prevCount => prevCount + 1);
              // Döngüyü tekrarla
              startBreathingCycle();
            }, currentExercise.pauseTime);
          } else {
            setBreathCount(prevCount => prevCount + 1);
            // Döngüyü tekrarla
            startBreathingCycle();
          }
        }, currentExercise.exhaleTime);
      }, currentExercise.holdTime);
    }, currentExercise.inhaleTime);
  };
  
  // Nefes alma seansını başlat/durdur
  const toggleBreathingSession = () => {
    if (sessionActive) {
      // Seansı durdur
      clearTimeout(timerRef.current);
      setSessionActive(false);
      setBreathingState('idle');
      animateCircle(1, 300);
      setBreathCount(0);
    } else {
      // Seansı başlat
      startBreathingCycle();
    }
  };
  
  // Egzersiz tipini değiştir
  const changeExercise = (exerciseKey) => {
    if (sessionActive) {
      clearTimeout(timerRef.current);
      setSessionActive(false);
      setBreathingState('idle');
      animateCircle(1, 300);
      setBreathCount(0);
    }
    
    setSelectedExercise(exerciseKey);
  };
  
  // Temizlik işlevi
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Başlık */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nefes Egzersizi</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Egzersiz seçimi */}
      <View style={styles.exerciseSelector}>
        {Object.entries(exercises).map(([key, exercise]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.exerciseButton,
              selectedExercise === key && [styles.selectedExercise, { backgroundColor: `${exercise.color}20` }]
            ]}
            onPress={() => changeExercise(key)}
            disabled={sessionActive}
          >
            <View style={[
              styles.exerciseDot,
              selectedExercise === key && { backgroundColor: exercise.color }
            ]} />
            <Text style={[
              styles.exerciseText,
              selectedExercise === key && { color: exercise.color, fontWeight: '600' }
            ]}>
              {exercise.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Açıklama */}
      <Text style={styles.exerciseDescription}>
        {currentExercise.description}
      </Text>
      
      {/* Ana nefes dairesi */}
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.breathCircle,
            {
              transform: [{ scale: circleSize }],
              opacity: circleOpacity,
              backgroundColor: `${currentExercise.color}50`,
              borderColor: currentExercise.color,
            },
          ]}
        />
        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionText, { color: currentExercise.color }]}>
            {getInstructionMessage()}
          </Text>
          {sessionActive && (
            <Text style={styles.breathCountText}>
              {breathCount} nefes tamamlandı
            </Text>
          )}
        </View>
      </View>
      
      {/* Başlat/Durdur butonu */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: currentExercise.color }]}
        onPress={toggleBreathingSession}
      >
        <Text style={styles.actionButtonText}>
          {sessionActive ? 'Durdur' : 'Başlat'}
        </Text>
      </TouchableOpacity>
      
      {/* İpuçları */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Nefes Alma İpuçları</Text>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color={currentExercise.color} />
          <Text style={styles.tipText}>Rahat bir pozisyonda oturun veya uzanın</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color={currentExercise.color} />
          <Text style={styles.tipText}>Burnunuzdan derin nefes alın, ağzınızdan verin</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color={currentExercise.color} />
          <Text style={styles.tipText}>Dikkatinizi nefesinize odaklayın</Text>
        </View>
      </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  exerciseSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  exerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  selectedExercise: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginRight: 6,
  },
  exerciseText: {
    fontSize: 14,
    color: '#4B5563',
  },
  exerciseDescription: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    height: 260,
  },
  breathCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    position: 'absolute',
  },
  instructionContainer: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  breathCountText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignSelf: 'center',
    marginVertical: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  tipsContainer: {
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
}); 