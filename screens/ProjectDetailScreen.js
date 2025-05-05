import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
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

export default function ProjectDetailScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { projectId } = route.params;
  
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Animasyon değerleri
  const progressValue = useSharedValue(0);
  const progressOpacity = useSharedValue(1);
  
  // Progress animasyon stili
  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value}%`,
      opacity: progressOpacity.value
    };
  });
  
  // Sayfa yüklendiğinde proje verilerini çek
  useEffect(() => {
    loadProjectData();
  }, [projectId]);
  
  // İlerleme durumunu güncelle
  useEffect(() => {
    if (project && project.tasks && project.tasks.length > 0) {
      const completedCount = project.tasks.filter(task => task.completed).length;
      const total = project.tasks.length;
      const percent = (completedCount / total) * 100;
      
      // Animasyonlu şekilde değeri güncelle
      // Önce dikkat çekmek için bir parlaklık animasyonu
      progressOpacity.value = withTiming(0.7, { duration: 100 }, () => {
        progressOpacity.value = withTiming(1, { duration: 500 });
      });
      
      // Ardından ilerleme animasyonu
      progressValue.value = withTiming(percent, { 
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      });
      
      setProgressPercent(percent);
    } else {
      setProgressPercent(0);
      progressValue.value = withTiming(0, { duration: 300 });
    }
  }, [project]);
  
  // Proje verilerini yükle
  const loadProjectData = async () => {
    try {
      const userProjectsKey = `${PROJECTS_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      const savedProjects = await AsyncStorage.getItem(userProjectsKey);
      
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        
        // İlgili projeyi bul
        const currentProject = parsedProjects.find(p => p.id === projectId);
        if (currentProject) {
          setProject(currentProject);
        } else {
          Alert.alert("Hata", "Proje bulunamadı");
          navigation.goBack();
        }
      } else {
        Alert.alert("Hata", "Projeler yüklenemedi");
        navigation.goBack();
      }
    } catch (error) {
      console.error('Proje yüklenirken hata:', error);
      Alert.alert("Hata", "Projeler yüklenirken bir sorun oluştu");
      navigation.goBack();
    }
  };
  
  // Projeleri kaydet
  const saveProjects = async (updatedProjects) => {
    try {
      const userProjectsKey = `${PROJECTS_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      await AsyncStorage.setItem(userProjectsKey, JSON.stringify(updatedProjects));
      
      // Güncel projeleri state'e kaydet
      setProjects(updatedProjects);
      
      // Mevcut projeyi de güncelle
      const updatedProject = updatedProjects.find(p => p.id === projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Projeler kaydedilirken hata:', error);
      Alert.alert("Hata", "Projeler kaydedilirken bir sorun oluştu");
    }
  };
  
  // Görevi kaydet
  const saveTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert("Hata", "Görev başlığı boş olamaz");
      return;
    }
    
    try {
      const updatedProjects = [...projects];
      const projectIndex = updatedProjects.findIndex(p => p.id === projectId);
      
      if (projectIndex === -1) {
        Alert.alert("Hata", "Proje bulunamadı");
        return;
      }
      
      // Eğer proje tasks dizisi yoksa oluştur
      if (!updatedProjects[projectIndex].tasks) {
        updatedProjects[projectIndex].tasks = [];
      }
      
      if (editingTask) {
        // Mevcut görevi düzenle
        const taskIndex = updatedProjects[projectIndex].tasks.findIndex(
          task => task.id === editingTask.id
        );
        
        if (taskIndex !== -1) {
          updatedProjects[projectIndex].tasks[taskIndex] = {
            ...updatedProjects[projectIndex].tasks[taskIndex],
            title: taskTitle
          };
        }
      } else {
        // Yeni görev ekle
        const newTask = {
          id: Date.now().toString(),
          title: taskTitle,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        updatedProjects[projectIndex].tasks.push(newTask);
      }
      
      // Güncelleme tarihini ayarla
      updatedProjects[projectIndex].updatedAt = Date.now();
      
      // Projeleri kaydet
      await saveProjects(updatedProjects);
      
      // Modalı kapat ve formu temizle
      setModalVisible(false);
      setTaskTitle('');
      setEditingTask(null);
      
    } catch (error) {
      console.error('Görev kaydedilirken hata:', error);
      Alert.alert("Hata", "Görev kaydedilirken bir sorun oluştu");
    }
  };
  
  // Görevi sil
  const deleteTask = (taskId) => {
    Alert.alert(
      "Görevi Sil",
      "Bu görevi silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              const updatedProjects = [...projects];
              const projectIndex = updatedProjects.findIndex(p => p.id === projectId);
              
              if (projectIndex !== -1 && updatedProjects[projectIndex].tasks) {
                // Görevi kaldır
                updatedProjects[projectIndex].tasks = updatedProjects[projectIndex].tasks.filter(
                  task => task.id !== taskId
                );
                
                // Güncelleme tarihini ayarla
                updatedProjects[projectIndex].updatedAt = Date.now();
                
                // Projeleri kaydet
                await saveProjects(updatedProjects);
              }
            } catch (error) {
              console.error('Görev silinirken hata:', error);
              Alert.alert("Hata", "Görev silinirken bir sorun oluştu");
            }
          }
        }
      ]
    );
  };
  
  // Görev durumunu değiştir
  const toggleTaskCompletion = async (taskId) => {
    try {
      const updatedProjects = [...projects];
      const projectIndex = updatedProjects.findIndex(p => p.id === projectId);
      
      if (projectIndex !== -1 && updatedProjects[projectIndex].tasks) {
        const taskIndex = updatedProjects[projectIndex].tasks.findIndex(
          task => task.id === taskId
        );
        
        if (taskIndex !== -1) {
          // Önceki durumu sakla
          const previousState = updatedProjects[projectIndex].tasks[taskIndex].completed;
          
          // Görev durumunu tersine çevir
          updatedProjects[projectIndex].tasks[taskIndex].completed = !previousState;
          
          // Tamamlandı tarihini ekle
          if (!previousState) {
            updatedProjects[projectIndex].tasks[taskIndex].completedAt = new Date().toISOString();
          } else {
            delete updatedProjects[projectIndex].tasks[taskIndex].completedAt;
          }
          
          // Güncelleme tarihini ayarla
          updatedProjects[projectIndex].updatedAt = Date.now();
          
          // Projeleri kaydet
          await saveProjects(updatedProjects);
          
          // Tamamlandı mesajını göster
          if (!previousState) {
            const completedCount = updatedProjects[projectIndex].tasks.filter(task => task.completed).length;
            const total = updatedProjects[projectIndex].tasks.length;
            
            if (completedCount === total) {
              // Tüm görevler tamamlandı
              Alert.alert(
                "Tebrikler!",
                "Projedeki tüm görevleri tamamladınız! 🎉",
                [
                  { text: "Harika!", style: "default" }
                ]
              );
            } else {
              // İlerleme mesajı
              const percent = Math.round((completedCount / total) * 100);
              
              // Platform'a göre bildirim göster
              if (Platform.OS === 'android') {
                ToastAndroid.showWithGravity(
                  `Görev tamamlandı! İlerleme: ${percent}%`,
                  ToastAndroid.SHORT,
                  ToastAndroid.BOTTOM
                );
              } else {
                // iOS için bildirim animasyonu göster
                // İlerlemeyi vurgula
                setProgressPercent(percent);
                progressValue.value = withTiming(percent, { 
                  duration: 800,
                  easing: Easing.bezier(0.25, 0.1, 0.25, 1)
                });
                
                // Opsiyonel: Hafif titreşim ekle
                if (Platform.OS === 'ios' && typeof Vibration !== 'undefined') {
                  Vibration.vibrate(100);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Görev durumu değiştirilirken hata:', error);
      Alert.alert("Hata", "Görev durumu değiştirilirken bir sorun oluştu");
    }
  };
  
  // Görev düzenleme modunu aç
  const openEditTaskMode = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setModalVisible(true);
  };
  
  // Görev ekleme modunu aç
  const openAddTaskMode = () => {
    setEditingTask(null);
    setTaskTitle('');
    setModalVisible(true);
  };
  
  // Görev sırasını güncelle
  const handleTaskReorder = async (newTasks) => {
    try {
      const updatedProjects = [...projects];
      const projectIndex = updatedProjects.findIndex(p => p.id === projectId);
      
      if (projectIndex !== -1) {
        // Sıralanmış görevleri proje nesnesine kaydet
        updatedProjects[projectIndex].tasks = newTasks;
        
        // Güncelleme tarihini ayarla
        updatedProjects[projectIndex].updatedAt = Date.now();
        
        // Projeleri kaydet
        await saveProjects(updatedProjects);
      }
    } catch (error) {
      console.error('Görev sırası güncellenirken hata:', error);
      Alert.alert("Hata", "Görev sırası güncellenirken bir sorun oluştu");
    }
  };
  
  // Görev öğesini render et
  const renderTaskItem = ({ item, index, drag, isActive }) => {
    // Renk hesaplaması için bir değişken
    const isRecentlyCompleted = item.completed && item.completedAt && 
      (Date.now() - new Date(item.completedAt).getTime() < 5000); // Son 5 saniye içinde tamamlandıysa
    
    return (
      <ScaleDecorator>
        <Animated.View
          entering={FadeIn.duration(300).delay(index * 100)}
          style={[
            styles.taskItem,
            isActive && styles.taskItemActive,
            item.completed && styles.taskItemCompleted,
            isRecentlyCompleted && styles.taskItemRecentlyCompleted,
            // Kategori rengini hafif olarak uygula
            !item.completed && {
              borderLeftWidth: 4,
              borderLeftColor: project?.categoryColor || COLORS.primary,
            }
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={drag}
            disabled={isActive}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          >
            <TouchableOpacity
              style={[
                styles.taskCheckbox,
                item.completed && { 
                  backgroundColor: COLORS.success,
                  borderColor: COLORS.success 
                },
                !item.completed && {
                  borderColor: project?.categoryColor || COLORS.primary
                }
              ]}
              onPress={() => toggleTaskCompletion(item.id)}
            >
              {item.completed && (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              )}
            </TouchableOpacity>
            
            <View style={styles.taskContent}>
              <Text 
                style={[
                  styles.taskTitle,
                  item.completed && styles.taskTitleCompleted
                ]}
              >
                {item.title}
              </Text>
              <Text style={styles.taskDate}>
                {item.completed && item.completedAt 
                  ? `Tamamlandı: ${new Date(item.completedAt).toLocaleDateString('tr-TR')}`
                  : `Oluşturuldu: ${new Date(item.createdAt).toLocaleDateString('tr-TR')}`
                }
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.taskActions}>
            {!item.completed && (
              <TouchableOpacity
                style={[styles.taskActionButton, {backgroundColor: project?.categoryColor || COLORS.primary}]}
                onPress={() => openEditTaskMode(item)}
              >
                <Ionicons name="pencil" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.taskActionButton, styles.taskDeleteButton]}
              onPress={() => deleteTask(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScaleDecorator>
    );
  };
  
  // Proje silme fonksiyonu
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
              const updatedProjects = [...projects].filter(project => project.id !== projectId);
              await saveProjects(updatedProjects);
              
              // Ana ekrana geri dön
              navigation.goBack();
            } catch (error) {
              console.error('Proje silinirken hata:', error);
              Alert.alert("Hata", "Proje silinirken bir sorun oluştu");
            }
          }
        }
      ]
    );
  };
  
  if (!project) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project.title}
          </Text>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteProject(project.id)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
        
        {/* Proje Başlığı ve Bilgisi */}
        <View style={styles.projectInfo}>
          <View style={[styles.categoryStrip, {backgroundColor: project.categoryColor || COLORS.primary}]} />
          <View style={styles.projectInfoContent}>
            <View style={styles.projectTitleContainer}>
              <Text style={styles.projectTitle}>{project.title}</Text>
            </View>
            
            <Text style={styles.projectDescription}>{project.description}</Text>
            
            <View style={styles.projectDateContainer}>
              {project.startDate && (
                <View style={styles.dateItem}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.dateText}>
                    Başlangıç: {new Date(project.startDate).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              )}
              
              {project.endDate && (
                <View style={styles.dateItem}>
                  <Ionicons name="flag-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.dateText}>
                    Bitiş: {new Date(project.endDate).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* İlerleme Çubuğu */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>İlerleme</Text>
            <View style={{
              backgroundColor: progressPercent === 100 ? '#E7F8EF' : progressPercent > 0 ? '#E5F0FF' : '#F3F4F6',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}>
              <Text 
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: progressPercent === 100 
                    ? COLORS.success 
                    : progressPercent > 0 
                      ? project?.categoryColor || COLORS.primary
                      : COLORS.textLight
                }}
              >
                {Math.round(progressPercent)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar, 
                progressAnimatedStyle,
                { 
                  backgroundColor: progressPercent === 100 
                    ? COLORS.success 
                    : project?.categoryColor || COLORS.primary
                }
              ]} 
            />
            {project.tasks && project.tasks.length > 0 && (
              <Text style={styles.progressDetail}>
                {project.tasks.filter(task => task.completed).length} / {project.tasks.length} görev tamamlandı
              </Text>
            )}
          </View>
        </View>
        
        {/* Görevler Başlığı */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Görevler</Text>
            <Text style={styles.taskCount}>
              {project.tasks ? `${project.tasks.length} görev` : '0 görev'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.addTaskButton, 
              {backgroundColor: project.categoryColor || COLORS.primary}
            ]}
            onPress={openAddTaskMode}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        
        {/* Görev Listesi */}
        <View style={styles.tasksContainer}>
          {project.tasks && project.tasks.length > 0 ? (
            <DraggableFlatList
              data={project.tasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data }) => handleTaskReorder(data)}
              contentContainerStyle={styles.tasksList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>Henüz görev eklenmemiş</Text>
              <TouchableOpacity 
                style={[styles.emptyButton, {backgroundColor: project.categoryColor || COLORS.primary}]}
                onPress={openAddTaskMode}
              >
                <Text style={styles.emptyButtonText}>Görev Ekle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Görev Ekleme/Düzenleme Modalı */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingTask ? "Görevi Düzenle" : "Yeni Görev Ekle"}
                </Text>
                
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <TextInput
                  style={styles.taskInput}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder="Görev başlığı girin..."
                  placeholderTextColor={COLORS.textLight}
                  autoFocus={true}
                  multiline={true}
                  maxLength={100}
                />
                
                <TouchableOpacity 
                  style={[styles.saveButton, {backgroundColor: project?.categoryColor || COLORS.primary}]}
                  onPress={saveTask}
                >
                  <Text style={styles.saveButtonText}>
                    {editingTask ? "Güncelle" : "Kaydet"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 235, 235, 0.8)',
  },
  projectInfo: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  projectInfoContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  projectTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    position: 'relative',
    paddingTop: 5,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 15,
  },
  projectDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  projectDateContainer: {
    marginTop: 10,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 5,
  },
  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressDetail: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  taskCount: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  addTaskButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  tasksContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tasksList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskItemActive: {
    backgroundColor: COLORS.primaryLight,
    shadowOpacity: 0.1,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  taskItemCompleted: {
    opacity: 0.9,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  taskItemRecentlyCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    transform: [{ scale: 1.01 }],
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
    paddingRight: 5,
  },
  taskTitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textLight,
  },
  taskDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  taskActions: {
    flexDirection: 'row',
  },
  taskActionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  taskDeleteButton: {
    backgroundColor: COLORS.danger,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: 30,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    elevation: 2,
  },
  emptyButtonText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '90%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
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
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  modalBody: {
    padding: 16,
  },
  taskInput: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  categoryStrip: {
    width: 12,
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 1,
  },
}); 