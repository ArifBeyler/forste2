import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    BackHandler,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
  primaryDark: '#3B5BD9', // Koyu mavi
  background: '#F8FAFE',
  backgroundDark: '#E9EFF9', // Daha koyu arka plan
  text: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
  success: '#10B981',
  warning: '#F97316',
  danger: '#EF4444',
  accent: '#8B5CF6',
};

export default function AddProjectScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { editProject } = route.params || {};
  
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectStartDate, setProjectStartDate] = useState(new Date());
  const [projectEndDate, setProjectEndDate] = useState(new Date());
  const [projectStartTime, setProjectStartTime] = useState(new Date());
  const [projectCategory, setProjectCategory] = useState('');
  
  // DateTimePicker için state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Geçici tarih değerleri için state
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [tempStartTime, setTempStartTime] = useState(new Date());
  
  // Kategori seçenekleri
  const categoryOptions = [
    { label: 'İş', value: 'iş', icon: 'briefcase-outline', color: '#4A6DA7' },  // Mavi
    { label: 'Kişisel', value: 'kişisel', icon: 'person-outline', color: '#8B5CF6' },  // Mor
    { label: 'Eğitim', value: 'eğitim', icon: 'school-outline', color: '#059669' },  // Yeşil
    { label: 'Sağlık', value: 'sağlık', icon: 'fitness-outline', color: '#DC2626' },  // Kırmızı
    { label: 'Proje', value: 'proje', icon: 'file-tray-full-outline', color: '#0284C7' },  // Turkuaz
    { label: 'Etkinlik', value: 'etkinlik', icon: 'calendar-outline', color: '#F59E0B' },  // Turuncu
    { label: 'Alışveriş', value: 'alışveriş', icon: 'cart-outline', color: '#EC4899' },  // Pembe
    { label: 'Seyahat', value: 'seyahat', icon: 'airplane-outline', color: '#0EA5E9' },  // Açık Mavi
    { label: 'Diğer', value: 'diğer', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },  // Gri
  ];
  
  // Düzenleme modu ise formu doldur
  useEffect(() => {
    if (editProject) {
      setProjectTitle(editProject.title);
      setProjectDescription(editProject.description);
      
      if (editProject.startDate) {
        setProjectStartDate(new Date(editProject.startDate));
      }
      if (editProject.endDate) {
        setProjectEndDate(new Date(editProject.endDate));
      }
      if (editProject.startTime) {
        const [hours, minutes] = editProject.startTime.split(':').map(Number);
        const startTime = new Date();
        startTime.setHours(hours, minutes, 0, 0);
        setProjectStartTime(startTime);
      }
      
      setProjectCategory(editProject.category || '');
    }
  }, [editProject]);
  
  // Modal açıkken geri tuşunu engelle (Android için)
  useEffect(() => {
    if (Platform.OS === 'android') {
      const isPickerOpen = showStartDatePicker || showEndDatePicker || showTimePicker;
      
      if (isPickerOpen) {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          return true; // Geri tuşunu engelle
        });
        
        return () => backHandler.remove();
      }
    }
  }, [showStartDatePicker, showEndDatePicker, showTimePicker]);
  
  // Proje kaydet
  const saveProject = async () => {
    if (!projectTitle.trim()) {
      Alert.alert("Hata", "Proje başlığı boş olamaz.");
      return;
    }
    
    try {
      // Mevcut projeleri yükle
      const userProjectsKey = `${PROJECTS_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      const savedProjectsData = await AsyncStorage.getItem(userProjectsKey);
      const savedProjects = savedProjectsData ? JSON.parse(savedProjectsData) : [];
      
      // Tarih ve saat formatla
      const formattedStartDate = formatDate(projectStartDate);
      const formattedEndDate = formatDate(projectEndDate);
      const formattedStartTime = formatTime(projectStartTime);
      
      let updatedProjects = [...savedProjects];
      const now = Date.now();
      
      if (editProject) {
        // Mevcut projeyi düzenle
        const index = updatedProjects.findIndex(project => project.id === editProject.id);
        if (index !== -1) {
          updatedProjects[index] = {
            ...updatedProjects[index],
            title: projectTitle,
            description: projectDescription,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            startTime: formattedStartTime,
            category: projectCategory,
            categoryColor: getCategoryColor(projectCategory),
            updatedAt: now
          };
        }
      } else {
        // Yeni proje ekle
        const newProject = {
          id: now.toString(),
          title: projectTitle,
          description: projectDescription,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          startTime: formattedStartTime,
          category: projectCategory,
          categoryColor: getCategoryColor(projectCategory),
          tasks: [],
          createdAt: now,
          updatedAt: now
        };
        
        // Yeni projeyi listenin başına ekle
        updatedProjects = [newProject, ...updatedProjects];
      }
      
      // Projeleri kaydet
      await AsyncStorage.setItem(userProjectsKey, JSON.stringify(updatedProjects));
      
      // Ana sayfaya dön
      navigation.goBack();
      
    } catch (error) {
      console.error('Proje kaydedilirken hata:', error);
      Alert.alert(
        "Hata", 
        "Proje kaydedilirken bir sorun oluştu."
      );
    }
  };
  
  // Kategori seçimi işle
  const handleCategorySelect = (category) => {
    setProjectCategory(category);
  };
  
  // Seçilen kategorinin rengini getir
  const getCategoryColor = (categoryValue) => {
    const selectedCategory = categoryOptions.find(option => option.value === categoryValue);
    return selectedCategory ? selectedCategory.color : COLORS.primary;
  };
  
  // Tarih formatla (YYYY-MM-DD)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Saat formatla (HH:MM)
  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Tarih gösterimi
  const displayDate = (date) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
  };
  
  // Saat gösterimi
  const displayTime = (date) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('tr-TR', options);
  };
  
  // Tarih değişim işleyicisi
  const onStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      if (selectedDate) {
        setProjectStartDate(selectedDate);
      }
    } else {
      // iOS için geçici değeri güncelle
      if (selectedDate) {
        setTempStartDate(selectedDate);
      }
    }
  };
  
  const onEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (selectedDate) {
        setProjectEndDate(selectedDate);
      }
    } else {
      // iOS için geçici değeri güncelle
      if (selectedDate) {
        setTempEndDate(selectedDate);
      }
    }
  };
  
  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (selectedTime) {
        setProjectStartTime(selectedTime);
      }
    } else {
      // iOS için geçici değeri güncelle
      if (selectedTime) {
        setTempStartTime(selectedTime);
      }
    }
  };
  
  // Modal Kapatma İşleyicileri
  const closeStartDatePicker = (save = false) => {
    if (save) {
      setProjectStartDate(tempStartDate);
    }
    setShowStartDatePicker(false);
  };
  
  const closeEndDatePicker = (save = false) => {
    if (save) {
      setProjectEndDate(tempEndDate);
    }
    setShowEndDatePicker(false);
  };
  
  const closeTimePicker = (save = false) => {
    if (save) {
      setProjectStartTime(tempStartTime);
    }
    setShowTimePicker(false);
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
          <Text style={styles.headerTitle}>
            {editProject ? 'Projeyi Düzenle' : 'Yeni Proje'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveProject}
        >
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
      
      {/* Form */}
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Proje Başlığı</Text>
            <TextInput
              style={styles.formInput}
              value={projectTitle}
              onChangeText={setProjectTitle}
              placeholder="Proje başlığını girin"
              placeholderTextColor={COLORS.textLight}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Açıklama</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={projectDescription}
              onChangeText={setProjectDescription}
              placeholder="Proje açıklamasını girin"
              placeholderTextColor={COLORS.textLight}
              multiline={true}
              textAlignVertical="top"
            />
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tarihleri Ayarla</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Başlangıç Tarihi</Text>
            <Pressable 
              style={styles.dateTimeButton}
              onPress={() => {
                setTempStartDate(projectStartDate);
                setShowStartDatePicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.dateTimeIcon} />
              <Text style={styles.dateTimeButtonText}>{displayDate(projectStartDate)}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
            </Pressable>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Bitiş Tarihi</Text>
            <Pressable
              style={styles.dateTimeButton}
              onPress={() => {
                setTempEndDate(projectEndDate);
                setShowEndDatePicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.dateTimeIcon} />
              <Text style={styles.dateTimeButtonText}>{displayDate(projectEndDate)}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
            </Pressable>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Başlangıç Saati</Text>
            <Pressable
              style={styles.dateTimeButton}
              onPress={() => {
                setTempStartTime(projectStartTime);
                setShowTimePicker(true);
              }}
            >
              <Ionicons name="time-outline" size={20} color={COLORS.primary} style={styles.dateTimeIcon} />
              <Text style={styles.dateTimeButtonText}>{displayTime(projectStartTime)}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
            </Pressable>
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kategori</Text>
          <View style={styles.categoryContainer}>
            {categoryOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryOption,
                  projectCategory === option.value && styles.categoryOptionSelected,
                  projectCategory === option.value && { backgroundColor: option.color }
                ]}
                onPress={() => handleCategorySelect(option.value)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={projectCategory === option.value ? COLORS.white : option.color} 
                  style={styles.categoryIcon}
                />
                <Text 
                  style={[
                    styles.categoryOptionText,
                    projectCategory === option.value && styles.categoryOptionTextSelected
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {/* Date Time Pickerleri (iOS) */}
      {Platform.OS === 'ios' && (
        <>
          <Modal
            transparent={true}
            visible={showStartDatePicker}
            animationType="fade"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerModal}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => closeStartDatePicker(false)}>
                    <Text style={styles.modalCancelText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.modalTitle}>Başlangıç Tarihi</Text>
                  
                  <TouchableOpacity onPress={() => closeStartDatePicker(true)}>
                    <Text style={styles.modalDoneText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={tempStartDate}
                    mode="date"
                    display="spinner"
                    onChange={onStartDateChange}
                    locale="tr-TR"
                    style={styles.dateTimePicker}
                    textColor="#000000"
                  />
                </View>
              </View>
            </View>
          </Modal>
          
          <Modal
            transparent={true}
            visible={showEndDatePicker}
            animationType="fade"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerModal}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => closeEndDatePicker(false)}>
                    <Text style={styles.modalCancelText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.modalTitle}>Bitiş Tarihi</Text>
                  
                  <TouchableOpacity onPress={() => closeEndDatePicker(true)}>
                    <Text style={styles.modalDoneText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={tempEndDate}
                    mode="date"
                    display="spinner"
                    onChange={onEndDateChange}
                    locale="tr-TR"
                    style={styles.dateTimePicker}
                    textColor="#000000"
                  />
                </View>
              </View>
            </View>
          </Modal>
          
          <Modal
            transparent={true}
            visible={showTimePicker}
            animationType="fade"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerModal}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => closeTimePicker(false)}>
                    <Text style={styles.modalCancelText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.modalTitle}>Başlangıç Saati</Text>
                  
                  <TouchableOpacity onPress={() => closeTimePicker(true)}>
                    <Text style={styles.modalDoneText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={tempStartTime}
                    mode="time"
                    display="spinner"
                    onChange={onTimeChange}
                    locale="tr-TR"
                    style={styles.dateTimePicker}
                    textColor="#000000"
                  />
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
      
      {/* Android için DatePicker */}
      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={projectStartDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}
      
      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={projectEndDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}
      
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={projectStartTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
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
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateTimeIcon: {
    marginRight: 8,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    width: '48%',
    backgroundColor: COLORS.white,
  },
  categoryOptionSelected: {
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.danger,
    fontWeight: '500',
  },
  modalDoneText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
  },
  dateTimePicker: {
    height: 200,
    width: '100%',
    backgroundColor: 'transparent',
  },
}); 