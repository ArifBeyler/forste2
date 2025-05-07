import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuccessToast from '../components/SuccessToast';
import { useCalendar } from '../context/CalendarContext';

const windowHeight = Dimensions.get('window').height;

// Etkinlik kategorileri sabitleri
const TASK_CATEGORIES = {
  PERSONAL_DEV: 'personal_dev',   // Kişisel Gelişim
  SPORT: 'sport',                 // Spor
  WORK: 'work',                   // İş / Üretkenlik
  RELATIONSHIP: 'relationship',   // İlişkisel
  SHOPPING: 'shopping',           // Alışveriş
  HOME: 'home',                   // Ev İşleri
  HEALTH: 'health',               // Sağlık
  DAILY: 'daily'                  // Günlük Rutin
};

// Kategori renkleri - İstatistik kategorileriyle aynı renkler
const CATEGORY_COLORS = {
  personal_dev: '#FF6384',  // Kişisel Gelişim - Pembe/Kırmızı
  sport: '#36A2EB',         // Spor - Mavi
  work: '#FFCE56',          // İş / Üretkenlik - Sarı
  relationship: '#4BC0C0',  // İlişkisel - Turkuaz
  shopping: '#9C27B0',      // Alışveriş - Mor
  home: '#8BC34A',          // Ev İşleri - Yeşil
  health: '#F44336',        // Sağlık - Kırmızı
  daily: '#FF9800'          // Günlük Rutin - Turuncu
};

export default function AddTaskScreen({ navigation, route }) {
  const { addTask } = useCalendar();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [reminderOption, setReminderOption] = useState(null);
  const [isAllDay, setIsAllDay] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState(TASK_CATEGORIES.WORK); // Varsayılan kategori: İş
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Modal states
  const [iconModalVisible, setIconModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('start'); // 'start' veya 'end'
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false); // Öncelik modal durumu
  const [categoryModalVisible, setCategoryModalVisible] = useState(false); // Kategori modal durumu
  
  // Tarih ve saat değerleri
  const [date, setDate] = useState(new Date());
  const [startTimeValue, setStartTimeValue] = useState(new Date());
  const [endTimeValue, setEndTimeValue] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));
  
  // Spinner durumu
  const [loading, setLoading] = useState(false);
  
  // Hatırlatma seçenekleri
  const reminderOptions = [
    { id: 'on_time', label: 'Zamanında', minutes: 0 },
    { id: '5_min', label: '5 dakika önce', minutes: 5 },
    { id: '10_min', label: '10 dakika önce', minutes: 10 },
    { id: '15_min', label: '15 dakika önce', minutes: 15 },
    { id: '30_min', label: '30 dakika önce', minutes: 30 },
    { id: '1_hour', label: '1 saat önce', minutes: 60 },
  ];

  // Öncelik seçenekleri
  const priorityOptions = [
    { id: 'high', label: 'Yüksek Öncelik', color: '#E53935', icon: 'alert-circle-outline' },
    { id: 'medium', label: 'Orta Öncelik', color: '#FB8C00', icon: 'time-outline' },
    { id: 'low', label: 'Düşük Öncelik', color: '#43A047', icon: 'checkmark-circle-outline' },
  ];

  // Kategori seçenekleri
  const categoryOptions = [
    { id: TASK_CATEGORIES.PERSONAL_DEV, label: 'Kişisel Gelişim', color: CATEGORY_COLORS.personal_dev, icon: 'book-outline' },
    { id: TASK_CATEGORIES.SPORT, label: 'Spor', color: CATEGORY_COLORS.sport, icon: 'fitness-outline' },
    { id: TASK_CATEGORIES.WORK, label: 'İş / Üretkenlik', color: CATEGORY_COLORS.work, icon: 'briefcase-outline' },
    { id: TASK_CATEGORIES.RELATIONSHIP, label: 'İlişkisel', color: CATEGORY_COLORS.relationship, icon: 'people-outline' },
    { id: TASK_CATEGORIES.SHOPPING, label: 'Alışveriş', color: CATEGORY_COLORS.shopping, icon: 'cart-outline' },
    { id: TASK_CATEGORIES.HOME, label: 'Ev İşleri', color: CATEGORY_COLORS.home, icon: 'home-outline' },
    { id: TASK_CATEGORIES.HEALTH, label: 'Sağlık', color: CATEGORY_COLORS.health, icon: 'medical-outline' },
    { id: TASK_CATEGORIES.DAILY, label: 'Günlük Rutin', color: CATEGORY_COLORS.daily, icon: 'today-outline' },
  ];

  // Tarih seçiciyi göster
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };
  
  // Başlangıç saati seçiciyi göster
  const showStartTimePicker = () => {
    setTimePickerMode('start');
    setTimePickerVisible(true);
  };
  
  // Bitiş saati seçiciyi göster
  const showEndTimePicker = () => {
    setTimePickerMode('end');
    setTimePickerVisible(true);
  };

  // Tarihi formatla
  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Görev ekle
  const handleAddTask = async () => {
    // Hata kontrolü
    const formErrors = {};
    if (!title) formErrors.title = 'Başlık gerekli';

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Saat bilgilerini güvenli şekilde formatlama
      let formattedStartTime = null;
      let formattedEndTime = null;
      
      if (!isAllDay && startTime) {
        formattedStartTime = startTime;
      }
      
      if (!isAllDay && endTime) {
        formattedEndTime = endTime;
      }
      
      // Kategori rengini belirle
      const taskColor = getCategoryColor(category);
      
      // Görev verisi
      const newTask = {
        title,
        description,
        type: 'todo',
        category: category, // Kategori bilgisi ekledik
        day: date.getDate(),
        date: date.toISOString().split('T')[0], // ISO formatında tarih
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        isAllDay,
        reminderOption,
        priority,
        completed: false,
        color: taskColor,
        icon: 'checkbox-outline' // Görevler için sabit simge
      };

      const result = await addTask(newTask);

      if (result && result.success) {
        // Başarılı mesajı göster
        setToastMessage('Görev başarıyla eklendi!');
        setToastVisible(true);
        
        // 2 saniye sonra ana ekrana dön
        setTimeout(() => {
          navigation.navigate('Calendar', { refreshEvents: true });
        }, 1000);
      } else {
        Alert.alert('Hata', result?.error || 'Görev eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Görev eklenemedi:', error);
      Alert.alert('Hata', 'Görev eklenirken teknik bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Kategoriye göre renk belirleme
  const getCategoryColor = (categoryId) => {
    return CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.work;
  };
  
  // Tarih içinden gün değerini çıkartma
  const extractDayFromDate = (dateString) => {
    // "25 Mayıs 2025" gibi bir formattan gün kısmını çıkarır
    try {
      const parts = dateString.split(' ');
      return parseInt(parts[0], 10);
    } catch (e) {
      // Varsayılan olarak bugünün gününü döndür
      return new Date().getDate();
    }
  };
  
  // Tarih değişikliği
  const handleDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      setDate(selectedDate);
      
      // Tarih formatlama
      const formattedDate = selectedDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      setSelectedDate(formattedDate);
    }
  };
  
  // Saat değişikliği
  const handleTimeChange = (event, selectedTime) => {
    setTimePickerVisible(false);
    if (selectedTime) {
      // Saat formatlama
      const formattedTime = selectedTime.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      if (timePickerMode === 'start') {
        setStartTimeValue(selectedTime);
        setStartTime(formattedTime);
      } else {
        setEndTimeValue(selectedTime);
        setEndTime(formattedTime);
      }
    }
  };
  
  // Simge seçimi
  const handleIconSelect = (iconKey) => {
    setSelectedIcon(iconKey);
    setIconModalVisible(false);
  };
  
  // Hatırlatma seçimi
  const handleReminderSelect = (option) => {
    setReminderOption(option);
    setReminderModalVisible(false);
  };

  // Öncelik seçimi
  const handlePrioritySelect = (priorityOption) => {
    setPriority(priorityOption);
    setPriorityModalVisible(false);
  };

  // Kategori seçimi
  const handleCategorySelect = (categoryId) => {
    setCategory(categoryId);
    setCategoryModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Yeni Görev</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <TouchableOpacity style={styles.saveButton} onPress={handleAddTask} disabled={isSubmitting}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Form */}
          <View style={styles.form}>
            {/* Başlık Giriş Alanı */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Başlık</Text>
              <TextInput
                style={styles.input}
                placeholder="Görev başlığı"
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>
            
            {/* Açıklama Giriş Alanı */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Görev açıklaması"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
            
            {/* Tarih Seçimi */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Tarih</Text>
              <TouchableOpacity 
                style={styles.selector}
                onPress={showDatePicker}
              >
                <View style={styles.selectorIconContainer}>
                  <Ionicons name="calendar-outline" size={22} color="#3B82F6" />
                </View>
                <Text style={styles.selectorText}>
                  {selectedDate ? selectedDate : 'Tarih seç'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Tüm Gün Seçimi */}
            <View style={styles.formSectionRow}>
              <Text style={styles.label}>Tüm gün</Text>
              <Switch
                value={isAllDay}
                onValueChange={setIsAllDay}
                trackColor={{ false: "#e0e0e0", true: "#bbe2fc" }}
                thumbColor={isAllDay ? "#3B82F6" : "#f5f5f5"}
              />
            </View>
            
            {/* Başlangıç ve Bitiş Zamanı */}
            {!isAllDay && (
              <View style={styles.formSection}>
                <Text style={styles.label}>Zaman Aralığı</Text>
                <View style={styles.timeRow}>
                  <TouchableOpacity 
                    style={[styles.selector, styles.timeSelector]}
                    onPress={showStartTimePicker}
                  >
                    <View style={styles.selectorIconContainer}>
                      <Ionicons name="time-outline" size={22} color="#3B82F6" />
                    </View>
                    <Text style={styles.selectorText}>
                      {startTime ? startTime : 'Başlangıç'}
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.timeSeparator}>-</Text>
                  
                  <TouchableOpacity 
                    style={[styles.selector, styles.timeSelector]}
                    onPress={showEndTimePicker}
                  >
                    <Text style={styles.selectorText}>
                      {endTime ? endTime : 'Bitiş'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Kategori Seçimi */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Kategori</Text>
              <TouchableOpacity 
                style={styles.selector}
                onPress={() => setCategoryModalVisible(true)}
              >
                {category ? (
                  <View style={styles.categorySelector}>
                    <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor(category) }]} />
                    <View style={styles.selectorIconContainer}>
                      <Ionicons name={categoryOptions.find(c => c.id === category)?.icon || 'briefcase-outline'} size={22} color={getCategoryColor(category)} />
                    </View>
                    <Text style={[styles.selectorText, { color: getCategoryColor(category), fontWeight: '600' }]}>
                      {categoryOptions.find(c => c.id === category)?.label || 'Kategori seç'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.categorySelector}>
                    <View style={styles.selectorIconContainer}>
                      <Ionicons name="briefcase-outline" size={22} color="#666" />
                    </View>
                    <Text style={styles.selectorText}>Kategori seç</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Öncelik Seçimi */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Öncelik</Text>
              <TouchableOpacity 
                style={styles.selector}
                onPress={() => setPriorityModalVisible(true)}
              >
                {priority ? (
                  <View style={styles.prioritySelector}>
                    <View style={[styles.priorityIndicator, { backgroundColor: getTaskColor(priority) }]} />
                    <View style={styles.selectorIconContainer}>
                      <Ionicons name={priorityOptions.find(p => p.id === priority)?.icon || 'time-outline'} size={22} color={getTaskColor(priority)} />
                    </View>
                    <Text style={[styles.selectorText, { color: getTaskColor(priority), fontWeight: '600' }]}>
                      {priorityOptions.find(p => p.id === priority)?.label || 'Öncelik seç'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.prioritySelector}>
                    <View style={styles.selectorIconContainer}>
                      <Ionicons name="flag-outline" size={22} color="#666" />
                    </View>
                    <Text style={styles.selectorText}>Öncelik seç</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Hatırlatma Seçimi */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Hatırlatma</Text>
              <TouchableOpacity 
                style={styles.selector}
                onPress={() => setReminderModalVisible(true)}
              >
                <View style={styles.selectorIconContainer}>
                  <Ionicons name="notifications-outline" size={22} color="#3B82F6" />
                </View>
                <Text style={styles.selectorText}>
                  {reminderOption ? reminderOptions.find(r => r.id === reminderOption)?.label : 'Hatırlatma ekle'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
      
      {/* Date Picker Modal */}
      {Platform.OS === 'ios' ? (
        <Modal
          animationType="slide"
          transparent={true}
          visible={datePickerVisible}
          onRequestClose={() => setDatePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dateTimePickerContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Text style={styles.cancelButton}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setDatePickerVisible(false);
                  handleDateChange(null, date);
                }}>
                  <Text style={styles.doneButton}>Tamam</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="inline"
                onChange={(event, date) => setDate(date || new Date())}
                locale="tr-TR"
              />
            </View>
          </View>
        </Modal>
      ) : (
        datePickerVisible && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            locale="tr-TR"
          />
        )
      )}
      
      {/* Time Picker Modal */}
      {Platform.OS === 'ios' ? (
        <Modal
          animationType="slide"
          transparent={true}
          visible={timePickerVisible}
          onRequestClose={() => setTimePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dateTimePickerContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                  <Text style={styles.cancelButton}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setTimePickerVisible(false);
                  handleTimeChange(null, timePickerMode === 'start' ? startTimeValue : endTimeValue);
                }}>
                  <Text style={styles.doneButton}>Tamam</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={timePickerMode === 'start' ? startTimeValue : endTimeValue}
                mode="time"
                display="spinner"
                onChange={(event, selectedTime) => {
                  if (timePickerMode === 'start') {
                    setStartTimeValue(selectedTime || new Date());
                  } else {
                    setEndTimeValue(selectedTime || new Date());
                  }
                }}
                locale="tr-TR"
              />
            </View>
          </View>
        </Modal>
      ) : (
        timePickerVisible && (
          <DateTimePicker
            value={timePickerMode === 'start' ? startTimeValue : endTimeValue}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            locale="tr-TR"
          />
        )
      )}
      
      {/* Reminder Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reminderModalVisible}
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reminderModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hatırlatma</Text>
              <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reminderOptions}>
              {reminderOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.reminderOption,
                    reminderOption === option.id && styles.selectedReminderOption
                  ]}
                  onPress={() => handleReminderSelect(option.id)}
                >
                  <Text style={[
                    styles.reminderOptionText,
                    reminderOption === option.id && styles.selectedReminderOptionText
                  ]}>
                    {option.label}
                  </Text>
                  {reminderOption === option.id && (
                    <Ionicons name="checkmark" size={18} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Priority Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={priorityModalVisible}
        onRequestClose={() => setPriorityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reminderModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Öncelik Seç</Text>
              <TouchableOpacity onPress={() => setPriorityModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reminderOptions}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.reminderOption,
                    priority === option.id && styles.selectedReminderOption,
                    { borderLeftWidth: 4, borderLeftColor: option.color }
                  ]}
                  onPress={() => handlePrioritySelect(option.id)}
                >
                  <View style={styles.priorityOptionContent}>
                    <Ionicons name={option.icon} size={22} color={option.color} style={{ marginRight: 10 }} />
                    <Text style={[
                      styles.reminderOptionText,
                      priority === option.id && { color: option.color, fontWeight: '600' }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {priority === option.id && (
                    <Ionicons name="checkmark" size={18} color={option.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Kategori Seçim Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reminderModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kategori Seç</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reminderOptions}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.reminderOption,
                    category === option.id && styles.selectedReminderOption,
                    { borderLeftWidth: 4, borderLeftColor: option.color }
                  ]}
                  onPress={() => handleCategorySelect(option.id)}
                >
                  <View style={styles.priorityOptionContent}>
                    <Ionicons name={option.icon} size={22} color={option.color} style={{ marginRight: 10 }} />
                    <Text style={[
                      styles.reminderOptionText,
                      category === option.id && { color: option.color, fontWeight: '600' }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {category === option.id && (
                    <Ionicons name="checkmark" size={18} color={option.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Success Toast */}
      <SuccessToast 
        visible={toastVisible} 
        message={toastMessage} 
        onClose={() => setToastVisible(false)} 
      />
    </SafeAreaView>
  );
}

// Simge seçenekleri
const icons = [
  { name: 'walk-outline', key: 'walk', label: 'Yürüyüş' },
  { name: 'headset-outline', key: 'headset', label: 'Müzik' },
  { name: 'document-outline', key: 'document', label: 'Belge' },
  { name: 'pizza-outline', key: 'food', label: 'Yemek' },
  { name: 'basketball-outline', key: 'sport', label: 'Spor' },
  { name: 'airplane-outline', key: 'travel', label: 'Seyahat' },
  { name: 'ticket-outline', key: 'ticket', label: 'Bilet' },
  { name: 'videocam-outline', key: 'video', label: 'Video' },
  { name: 'car-outline', key: 'car', label: 'Araba' },
  { name: 'bus-outline', key: 'bus', label: 'Toplu Taşıma' },
  { name: 'cloud-outline', key: 'cloud', label: 'Hava Durumu' },
  { name: 'briefcase-outline', key: 'briefcase', label: 'İş' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },
  scrollView: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  form: {
    padding: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  formSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectorIconContainer: {
    marginRight: 12,
  },
  selectorText: {
    fontSize: 16,
    color: '#666',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSelector: {
    flex: 1,
  },
  timeSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dateTimePickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    color: '#666',
    fontSize: 16,
  },
  doneButton: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: windowHeight * 0.7,
  },
  reminderOptions: {
    marginTop: 8,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  selectedReminderOption: {
    backgroundColor: '#F0F7FF',
  },
  reminderOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedReminderOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  priorityOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  prioritySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
}); 