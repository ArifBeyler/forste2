import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

// AsyncStorage anahtarı
const PROJECTS_STORAGE_KEY = 'user_projects';

// Renk Paleti
const COLORS = {
  primary: '#4F6AF0', // Mavi
  primaryLight: '#E5F0FF',
  background: '#F8FAFE',
  text: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
  success: '#10B981',
  warning: '#F97316',
  danger: '#EF4444',
  accent: '#8B5CF6',
};

export default function StatisticsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [projectStats, setProjectStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    tasksCompleted: 0,
    totalTasks: 0
  });
  
  useEffect(() => {
    loadProjects();
  }, []);
  
  // Proje istatistiklerini yükle
  const loadProjects = async () => {
    try {
      const userProjectsKey = `${PROJECTS_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      const savedProjects = await AsyncStorage.getItem(userProjectsKey);
      
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        
        // İstatistikleri hesapla
        let totalProjects = projects.length;
        let completedProjects = 0;
        let totalTasks = 0;
        let completedTasks = 0;
        
        projects.forEach(project => {
          const projectTasks = project.tasks || [];
          totalTasks += projectTasks.length;
          completedTasks += projectTasks.filter(task => task.completed).length;
          
          // Proje tamamlanmış mı?
          if (projectTasks.length > 0 && projectTasks.every(task => task.completed)) {
            completedProjects++;
          }
        });
        
        setProjectStats({
          total: totalProjects,
          completed: completedProjects,
          inProgress: totalProjects - completedProjects,
          tasksCompleted: completedTasks,
          totalTasks: totalTasks
        });
      }
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  };
  
  // İlerleme yüzdesini hesapla
  const getProjectCompletionRate = () => {
    if (projectStats.total === 0) return 0;
    return Math.round((projectStats.completed / projectStats.total) * 100);
  };
  
  const getTaskCompletionRate = () => {
    if (projectStats.totalTasks === 0) return 0;
    return Math.round((projectStats.tasksCompleted / projectStats.totalTasks) * 100);
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Başlık */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Proje İstatistikleri</Text>
        
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Özet Kart */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{projectStats.total}</Text>
            <Text style={styles.summaryLabel}>Toplam Proje</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{projectStats.completed}</Text>
            <Text style={styles.summaryLabel}>Tamamlanan</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{projectStats.inProgress}</Text>
            <Text style={styles.summaryLabel}>Devam Eden</Text>
          </View>
        </View>
        
        {/* İlerleme Kartları */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Proje Tamamlama Oranı</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${getProjectCompletionRate()}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{getProjectCompletionRate()}%</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statText}>
              Tamamlanan Projeler: <Text style={styles.statValue}>{projectStats.completed}</Text>
            </Text>
            <Text style={styles.statText}>
              Toplam Projeler: <Text style={styles.statValue}>{projectStats.total}</Text>
            </Text>
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Görev Tamamlama Oranı</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${getTaskCompletionRate()}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{getTaskCompletionRate()}%</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statText}>
              Tamamlanan Görevler: <Text style={styles.statValue}>{projectStats.tasksCompleted}</Text>
            </Text>
            <Text style={styles.statText}>
              Toplam Görevler: <Text style={styles.statValue}>{projectStats.totalTasks}</Text>
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'right',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  statValue: {
    fontWeight: '600',
    color: COLORS.text,
  },
}); 