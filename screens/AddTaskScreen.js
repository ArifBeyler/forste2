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
      // Görev verisi
      const newTask = {
        title,
        description,
        type: 'todo',
        day: date.getDate(),
        date: date.toISOString().split('T')[0], // ISO formatında tarih
        startTime: isAllDay ? null : timeRange.startTime,
        endTime: isAllDay ? null : timeRange.endTime,
        isAllDay,
        reminderOption,
        priority,
        completed: false,
        color: getPriorityColor(priority),
        icon: 'checkbox-outline' // Görevler için sabit simge
      };

      const result = await addTask(newTask);

      if (result.success) {
        navigation.navigate('CalendarScreen', { refreshEvents: true });
      } else {
        Alert.alert('Hata', result.error || 'Görev eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Görev eklenemedi:', error);
      Alert.alert('Hata', 'Görev eklenirken teknik bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Önceliğe göre renk belirleme
  const getTaskColor = (priority) => {
    switch(priority) {
      case 'high':
        return '#E53935';
      case 'medium':
        return '#FB8C00';
      case 'low':
        return '#43A047';
      default:
        return '#43A047';
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Başlık */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Görev</Text>
          <TouchableOpacity style={styles.optionsButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {/* Başlık Alanı */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Başlık</Text>
            <TextInput
              style={styles.input}
              placeholder="Başlık"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#AAAAAA"
            />
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
              <Ionicons name="chevron-down" size={18} color="#999" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>

          {/* Simge Seçimi */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Simge Seç</Text>
            <TouchableOpacity 
              style={styles.iconSelector}
              onPress={() => setIconModalVisible(true)}
            >
              {selectedIcon ? (
                <View style={styles.selectedIconContainer}>
                  <Ionicons 
                    name={icons.find(icon => icon.key === selectedIcon)?.name || 'help-circle-outline'} 
                    size={28} 
                    color="#3B82F6" 
                  />
                  <Text style={styles.selectedIconText}>
                    {icons.find(icon => icon.key === selectedIcon)?.label || 'Simge Seç'}
                  </Text>
                </View>
              ) : (
                <View style={styles.selectedIconContainer}>
                  <Ionicons name="add-circle-outline" size={24} color="#666" />
                  <Text style={styles.selectorText}>Simge Seç</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Açıklama */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Açıklama"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#AAAAAA"
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
                <Ionicons name="calendar-outline" size={22} color="#666" />
              </View>
              <Text style={styles.selectorText}>
                {selectedDate ? selectedDate : 'Tarih seç'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tüm Gün Seçeneği - Tarih ve Zaman arasına taşındı */}
          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <View style={styles.selectorIconContainer}>
                <Ionicons name="time-outline" size={22} color="#666" />
              </View>
              <Text style={styles.selectorText}>Tüm Gün</Text>
            </View>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ false: "#e0e0e0", true: "#3B82F6" }}
              thumbColor="#fff"
            />
          </View>

          {/* Zaman Seçimi */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Zaman</Text>
            <View style={styles.timeSelectorsContainer}>
              <TouchableOpacity 
                style={styles.selector}
                onPress={showStartTimePicker}
              >
                <View style={styles.selectorIconContainer}>
                  <Ionicons name="time-outline" size={22} color="#666" />
                </View>
                <Text style={styles.selectorText}>
                  {startTime ? startTime : 'Başlangıç saati'}
                </Text>
              </TouchableOpacity>
              
              {!isAllDay && (
                <TouchableOpacity 
                  style={styles.selector}
                  onPress={showEndTimePicker}
                >
                  <View style={styles.selectorIconContainer}>
                    <Ionicons name="time-outline" size={22} color="#666" />
                  </View>
                  <Text style={styles.selectorText}>
                    {endTime ? endTime : 'Bitiş saati'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bildirim */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Bildirim Hatırlatması</Text>
            <TouchableOpacity 
              style={styles.selector}
              onPress={() => setReminderModalVisible(true)}
            >
              <View style={styles.selectorIconContainer}>
                <Ionicons name="notifications-outline" size={22} color="#666" />
              </View>
              <Text style={styles.selectorText}>
                {reminderOption ? reminderOption.label : 'Hatırlatma süresi seç'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>

          {/* Kaydet Butonu */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleAddTask}
              disabled={isSubmitting || !title}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Tarih Seçim Modalı */}
        {datePickerVisible && (
          <Modal
            animationType="fade"
            transparent={true}
            visible={datePickerVisible}
            onRequestClose={() => setDatePickerVisible(false)}
          >
            <TouchableOpacity 
              style={styles.datePickerModal} 
              activeOpacity={1}
              onPress={() => setDatePickerVisible(false)}
            >
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
                style={styles.datePickerPopup}
              >
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                    <Text style={styles.datePickerCancelText}>İptal</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Tarih Seç</Text>
                  <TouchableOpacity onPress={() => {
                    handleDateChange(null, date);
                    setDatePickerVisible(false);
                  }}>
                    <Text style={styles.datePickerDoneText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      setDate(selectedDate || date);
                    }}
                    locale="tr-TR"
                    style={styles.picker}
                    textColor="black"
                  />
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
        
        {/* Saat Seçim Modalı */}
        {timePickerVisible && (
          <Modal
            animationType="fade"
            transparent={true}
            visible={timePickerVisible}
            onRequestClose={() => setTimePickerVisible(false)}
          >
            <TouchableOpacity 
              style={styles.datePickerModal} 
              activeOpacity={1}
              onPress={() => setTimePickerVisible(false)}
            >
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
                style={styles.datePickerPopup}
              >
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                    <Text style={styles.datePickerCancelText}>İptal</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>
                    {timePickerMode === 'start' ? 'Başlangıç Saati' : 'Bitiş Saati'}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      handleTimeChange(
                        null, 
                        timePickerMode === 'start' ? startTimeValue : endTimeValue
                      );
                      setTimePickerVisible(false);
                    }}
                  >
                    <Text style={styles.datePickerDoneText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={timePickerMode === 'start' ? startTimeValue : endTimeValue}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (timePickerMode === 'start') {
                        setStartTimeValue(selectedTime || startTimeValue);
                      } else {
                        setEndTimeValue(selectedTime || endTimeValue);
                      }
                    }}
                    locale="tr-TR"
                    is24Hour={true}
                    style={styles.picker}
                    textColor="black"
                  />
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
        
        {/* İkon Seçim Modalı */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={iconModalVisible}
          onRequestClose={() => setIconModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Simge Seç</Text>
                <TouchableOpacity onPress={() => setIconModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.iconGrid}>
                {icons.map((icon) => (
                  <TouchableOpacity
                    key={icon.key}
                    style={[
                      styles.iconButton,
                      selectedIcon === icon.key && styles.selectedIconButton
                    ]}
                    onPress={() => handleIconSelect(icon.key)}
                  >
                    <Ionicons 
                      name={icon.name} 
                      size={24} 
                      color={selectedIcon === icon.key ? '#fff' : '#555'} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Hatırlatma Seçim Modalı */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={reminderModalVisible}
          onRequestClose={() => setReminderModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.reminderModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Hatırlatma Seç</Text>
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
                      reminderOption?.id === option.id && styles.selectedReminderOption
                    ]}
                    onPress={() => handleReminderSelect(option)}
                  >
                    <Text style={[
                      styles.reminderOptionText,
                      reminderOption?.id === option.id && styles.selectedReminderOptionText
                    ]}>
                      {option.label}
                    </Text>
                    {reminderOption?.id === option.id && (
                      <Ionicons name="checkmark" size={18} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Öncelik Seçim Modalı */}
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
                      priority && priority.id === option.id && styles.selectedReminderOption,
                      { borderLeftWidth: 4, borderLeftColor: option.color }
                    ]}
                    onPress={() => handlePrioritySelect(option)}
                  >
                    <View style={styles.priorityOptionContent}>
                      <Ionicons name={option.icon} size={22} color={option.color} style={{ marginRight: 10 }} />
                      <Text style={[
                        styles.reminderOptionText,
                        priority && priority.id === option.id && { color: option.color, fontWeight: '600' }
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                    {priority && priority.id === option.id && (
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
          onHide={() => setToastVisible(false)}
          type={toastMessage.includes('başarıyla') ? 'success' : 'warning'}
        />
      </KeyboardAvoidingView>
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
    backgroundColor: '#FFFFFF', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
  },
  input: {
    height: 55,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  iconSelector: {
    height: 55,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  selectedIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIconText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingVertical: 15,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedIconButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    height: 55,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSelectorsContainer: {
    flexDirection: 'column',
    gap: 15,
  },
  selector: {
    height: 55,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  selectorIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: '#555',
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  reminderModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reminderOptions: {
    marginTop: 5,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedReminderOption: {
    backgroundColor: '#EBF3FF',
    borderWidth: 1,
    borderColor: '#D1E3FF',
  },
  reminderOptionText: {
    fontSize: 16,
    color: '#444',
  },
  selectedReminderOptionText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  // iOS DatePicker Modal stilleri
  datePickerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerPopup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#777',
  },
  datePickerDoneText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  iosDatePicker: {
    width: '100%',
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
  priorityOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerContainer: {
    height: 220,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  picker: {
    height: 200,
    width: '100%',
    alignSelf: 'center',
  },
}); 