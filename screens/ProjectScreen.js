import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';
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

export default function ProjectScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'inProgress', 'completed'
  const [searchText, setSearchText] = useState('');
  
  // Animasyon değeri
  const addButtonScale = useSharedValue(1);
  
  // Animasyonu tetikle
  const animateAddButton = () => {
    addButtonScale.value = withSequence(
      withTiming(1.1, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
  };
  
  // Ekrana her odaklanıldığında projeleri yeniden yükle
  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );
  
  // İlk yükleme
  useEffect(() => {
    loadProjects();
  }, []);
  
  // Filtreleme işlevi
  useEffect(() => {
    let filtered = [...projects];
    
    // Arama filtresi uygula
    if (searchText.trim() !== '') {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchText.toLowerCase()) || 
        project.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Tab filtresi uygula
    if (filter === 'inProgress') {
      filtered = filtered.filter(project => {
        const completedTasks = project.tasks ? project.tasks.filter(task => task.completed).length : 0;
        const totalTasks = project.tasks ? project.tasks.length : 0;
        return totalTasks === 0 || completedTasks < totalTasks;
      });
    } else if (filter === 'completed') {
      filtered = filtered.filter(project => {
        const completedTasks = project.tasks ? project.tasks.filter(task => task.completed).length : 0;
        const totalTasks = project.tasks ? project.tasks.length : 0;
        return totalTasks > 0 && completedTasks === totalTasks;
      });
    }
    
    // Sıralama: Önce devam eden aktif projeler, sonra tamamlanmış projeler
    filtered.sort((a, b) => {
      const aCompleted = isProjectCompleted(a);
      const bCompleted = isProjectCompleted(b);
      const aOverdue = isProjectOverdue(a);
      const bOverdue = isProjectOverdue(b);
      
      // Tamamlanmış projeleri sona koy
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      
      // Tamamlanmamış projeler arasında, süresi geçenleri sonra koy
      if (!aCompleted) {
        if (aOverdue && !bOverdue) return 1;
        if (!aOverdue && bOverdue) return -1;
      }
      
      // Son güncellemeye göre sırala
      return b.updatedAt - a.updatedAt;
    });
    
    setFilteredProjects(filtered);
  }, [projects, searchText, filter]);
  
  // Projenin tamamlanıp tamamlanmadığını kontrol et
  const isProjectCompleted = (project) => {
    if (!project.tasks || project.tasks.length === 0) return false;
    const completedTasks = project.tasks.filter(task => task.completed).length;
    return completedTasks === project.tasks.length;
  };
  
  // Projenin süresinin geçip geçmediğini kontrol et
  const isProjectOverdue = (project) => {
    if (!project.endDate) return false;
    const now = new Date();
    const deadline = new Date(project.endDate);
    return deadline < now;
  };
  
  // Proje kayıtlarını AsyncStorage'dan yükle
  const loadProjects = async () => {
    try {
      const userProjectsKey = `${PROJECTS_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      const savedProjects = await AsyncStorage.getItem(userProjectsKey);
      
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        // Son eklenen projeleri üste getir
        const sortedProjects = parsedProjects.sort((a, b) => b.updatedAt - a.updatedAt);
        setProjects(sortedProjects);
        setFilteredProjects(sortedProjects);
      } else {
        // Boş projeler dizisi başlat
        setProjects([]);
        setFilteredProjects([]);
      }
    } catch (error) {
      console.error('Projeler yüklenirken hata:', error);
      Alert.alert(
        "Hata", 
        "Projeler yüklenirken bir sorun oluştu."
      );
    }
  };
  
  // Projeleri kaydet
  const saveProjects = async (updatedProjects) => {
    try {
      const userProjectsKey = `${PROJECTS_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      await AsyncStorage.setItem(userProjectsKey, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Projeler kaydedilirken hata:', error);
      Alert.alert(
        "Hata", 
        "Projeler kaydedilirken bir sorun oluştu."
      );
    }
  };
  
  // Proje sil
  const deleteProject = (projectId) => {
    Alert.alert(
      "Projeyi Sil",
      "Bu projeyi silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              const updatedProjects = projects.filter(project => project.id !== projectId);
              setProjects(updatedProjects);
              await saveProjects(updatedProjects);
            } catch (error) {
              console.error('Proje silinirken hata:', error);
              Alert.alert(
                "Hata", 
                "Proje silinirken bir sorun oluştu."
              );
            }
          }
        }
      ]
    );
  };
  
  // Proje düzenleme modunu aç
  const openEditMode = (project) => {
    navigation.navigate('AddProject', { editProject: project });
  };
  
  // Proje ekleme modunu aç
  const openAddMode = () => {
    // Buton animasyonu
    animateAddButton();
    
    // Yeni sayfaya yönlendir
    navigation.navigate('AddProject');
  };
  
  // Proje detaylarına git
  const navigateToProjectDetail = (projectId) => {
    navigation.navigate('ProjectDetail', { projectId });
  };
  
  // Tarih formatı
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const now = new Date();
    const deadline = new Date(dateString);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Süresi geçti';
    } else if (diffDays === 0) {
      return 'Bugün son gün';
    } else if (diffDays === 1) {
      return '1 gün kaldı';
    } else {
      return `${diffDays} gün kaldı`;
    }
  };
  
  // İlerleme yüzdesini hesapla
  const getProgressPercentage = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    
    const completedCount = project.tasks.filter(task => task.completed).length;
    return Math.round((completedCount / project.tasks.length) * 100);
  };
  
  // Animasyon stili
  const addButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: addButtonScale.value }],
    };
  });
  
  // Proje kartını render et
  const renderProjectItem = ({ item, index }) => {
    const progress = getProgressPercentage(item);
    const isCompleted = isProjectCompleted(item);
    const isOverdue = isProjectOverdue(item);
    const remainingTime = formatDate(item.endDate);
    
    return (
      <Animated.View 
        entering={FadeIn.delay(index * 100).duration(300)}
        style={[
          styles.projectCard,
          isCompleted && styles.completedProjectCard,
          isOverdue && !isCompleted && styles.overdueProjectCard,
          !isCompleted && !isOverdue && item.categoryColor && {
            borderLeftWidth: 0
          }
        ]}
      >
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteProject(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
        
        {item.category && (
          <View 
            style={[
              styles.categoryStrip, 
              {backgroundColor: item.categoryColor || COLORS.primary}
            ]} 
          />
        )}
        
        <TouchableOpacity 
          style={styles.projectCardInner}
          onPress={() => navigateToProjectDetail(item.id)}
          activeOpacity={0.9}
        >
          <View style={styles.projectHeader}>
            <Text 
              style={[
                styles.projectTitle, 
                isCompleted && styles.completedProjectTitle,
                isOverdue && !isCompleted && styles.overdueProjectTitle
              ]} 
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.projectDescription,
              isCompleted && styles.completedProjectDescription,
              isOverdue && !isCompleted && styles.overdueProjectDescription
            ]} 
            numberOfLines={2}
          >
            {item.description}
          </Text>
          
          <View style={styles.progressContainer}>
            <Text 
              style={[
                styles.progressLabel,
                isCompleted && styles.completedProgressLabel,
                isOverdue && !isCompleted && styles.overdueProgressLabel
              ]}
            >
              İlerleme
            </Text>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${progress}%`, 
                    backgroundColor: isCompleted 
                      ? COLORS.success 
                      : isOverdue 
                        ? COLORS.warning 
                        : COLORS.primary 
                  }
                ]} 
              />
            </View>
            
            <Text 
              style={[
                styles.progressPercentage,
                isCompleted && styles.completedProgressPercentage,
                isOverdue && !isCompleted && styles.overdueProgressPercentage
              ]}
            >
              {progress}%
            </Text>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={[
              styles.timeContainer,
              isOverdue && styles.overdueTimeContainer,
              isCompleted && styles.completedTimeContainer
            ]}>
              <Text style={[
                styles.timeText,
                isOverdue && styles.overdueTimeText,
                isCompleted && styles.completedTimeText
              ]}>
                {isCompleted ? 'Tamamlandı' : remainingTime}
              </Text>
            </View>
            
            {item.tasks && item.tasks.length > 0 && (
              <Text 
                style={[
                  styles.assignedByText,
                  isCompleted && styles.completedAssignedByText,
                  isOverdue && !isCompleted && styles.overdueAssignedByText
                ]}
              >
                Son güncelleme: {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
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
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Projelerim</Text>
          <Text style={styles.headerSubtitle}>Projelerinizi tamamlayın</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.statsButton}
          onPress={() => navigation.navigate('Statistics')}
        >
          <Ionicons name="stats-chart" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Görevlerinizi arayın"
          placeholderTextColor={COLORS.textLight}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchText('')}
            style={styles.clearSearchButton}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Tab Filtreleri */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, filter === 'all' && styles.activeTabButton]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.tabButtonText, filter === 'all' && styles.activeTabButtonText]}>
            Tümü
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, filter === 'inProgress' && styles.activeTabButton]}
          onPress={() => setFilter('inProgress')}
        >
          <Text style={[styles.tabButtonText, filter === 'inProgress' && styles.activeTabButtonText]}>
            Devam Ediyor
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, filter === 'completed' && styles.activeTabButton]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.tabButtonText, filter === 'completed' && styles.activeTabButtonText]}>
            Tamamlandı
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Projeler Listesi */}
      <View style={styles.content}>
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>
              {searchText ? 'Arama sonucu bulunamadı' : 'Henüz proje eklenmemiş'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchText 
                ? `"${searchText}" için sonuç bulunamadı`
                : 'Proje eklemek için sağ alt köşedeki + butonuna dokunun'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProjects}
            renderItem={renderProjectItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.projectsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Proje Ekleme Butonu */}
      <Animated.View style={[styles.fabContainer, addButtonAnimatedStyle]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={openAddMode}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: COLORS.text,
    height: '100%',
  },
  clearSearchButton: {
    padding: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  activeTabButtonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  projectsList: {
    paddingVertical: 10,
    paddingBottom: 80,
  },
  projectCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  completedProjectCard: {
    opacity: 0.9,
    backgroundColor: COLORS.white,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.success,
  },
  overdueProjectCard: {
    opacity: 0.85,
    backgroundColor: COLORS.white,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.warning,
  },
  projectCardInner: {
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
    paddingTop: 5,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    width: '90%',
  },
  completedProjectTitle: {
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  overdueProjectTitle: {
    color: COLORS.text,
    fontWeight: '700',
  },
  timeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  completedTimeContainer: {
    backgroundColor: '#e6f8f1', // Açık yeşil
  },
  completedTimeText: {
    color: COLORS.success,
  },
  overdueTimeContainer: {
    backgroundColor: '#fff5ed', // Açık turuncu
  },
  overdueTimeText: {
    color: COLORS.warning,
  },
  projectDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  completedProjectDescription: {
    color: COLORS.textLight,
    opacity: 0.8,
  },
  overdueProjectDescription: {
    color: COLORS.text,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  completedProgressLabel: {
    color: COLORS.textLight,
  },
  overdueProgressLabel: {
    color: COLORS.text,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  completedProgressPercentage: {
    color: COLORS.success,
  },
  overdueProgressPercentage: {
    color: COLORS.warning,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  assigneeContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  assignedByText: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textLight,
    marginLeft: 4,
  },
  completedAssignedByText: {
    color: COLORS.textLight,
    opacity: 0.8,
  },
  overdueAssignedByText: {
    color: COLORS.textLight,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalForm: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  deleteButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 235, 235, 0.9)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryStrip: {
    width: 8,
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
}); 