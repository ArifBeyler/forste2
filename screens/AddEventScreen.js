import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
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

const AddEventScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [location, setLocation] = useState('');
  const [participants, setParticipants] = useState([]);
  const [reminderOption, setReminderOption] = useState(null);
  const [isAllDay, setIsAllDay] = useState(false);
  const [eventType, setEventType] = useState('meeting'); // meeting, call, party, other

  // Modal states
  const [iconModalVisible, setIconModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [eventTypeModalVisible, setEventTypeModalVisible] = useState(false);
  
  // Tarih ve saat değerleri
  const [date, setDate] = useState(new Date());
  const [startTimeValue, setStartTimeValue] = useState(new Date());
  const [endTimeValue, setEndTimeValue] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));
  
  // Hatırlatma seçenekleri
  const reminderOptions = [
    { id: 'on_time', label: 'Zamanında', minutes: 0 },
    { id: '5_min', label: '5 dakika önce', minutes: 5 },
    { id: '10_min', label: '10 dakika önce', minutes: 10 },
    { id: '15_min', label: '15 dakika önce', minutes: 15 },
    { id: '30_min', label: '30 dakika önce', minutes: 30 },
    { id: '1_hour', label: '1 saat önce', minutes: 60 },
  ];

  // Mevcut kullanıcı
  const currentUser = 'Daniel George';

  // Simge seçenekleri
  const icons = [
    { name: 'people-outline', key: 'meeting', label: 'Toplantı' },
    { name: 'calendar-outline', key: 'event', label: 'Etkinlik' },
    { name: 'document-text-outline', key: 'review', label: 'İnceleme' },
    { name: 'color-palette-outline', key: 'design', label: 'Tasarım' },
    { name: 'call-outline', key: 'call', label: 'Arama' },
    { name: 'mail-outline', key: 'email', label: 'E-posta' },
    { name: 'desktop-outline', key: 'presentation', label: 'Sunum' },
    { name: 'restaurant-outline', key: 'lunch', label: 'Yemek' },
  ];

  // Etkinlik türleri
  const eventTypes = [
    { id: 'meeting', name: 'Toplantı', color: '#FFB74D' },
    { id: 'call', name: 'Görüşme', color: '#64B5F6' },
    { id: 'workshop', name: 'Atölye', color: '#81C784' },
    { id: 'presentation', name: 'Sunum', color: '#E57373' }
  ];

  // Form gönderme
  const handleSubmit = () => {
    // Form verilerini işle ve etkinlik ekle
    const newEvent = {
      title,
      description,
      icon: selectedIcon,
      type: eventType,
      date: selectedDate,
      startTime,
      endTime,
      location,
      participants: participants.length > 0 ? participants : [currentUser],
      reminderOption,
      isAllDay
    };
    
    console.log('Yeni etkinlik:', newEvent);
    // Buraya etkinlik ekleme API çağrısı gelecek
    
    // Önceki ekrana dön
    navigation.goBack();
  };
  
  // Tarih değişikliği
  const handleDateChange = (event, selectedDate) => {
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
    
    if (Platform.OS === 'android') {
      setDatePickerVisible(false);
    }
  };
  
  // Başlangıç saati değişikliği
  const handleStartTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setStartTimeValue(selectedTime);
      
      // Saat formatlama
      const formattedTime = selectedTime.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      setStartTime(formattedTime);
    }
    
    if (Platform.OS === 'android') {
      setStartTimePickerVisible(false);
    }
  };
  
  // Bitiş saati değişikliği
  const handleEndTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setEndTimeValue(selectedTime);
      
      // Saat formatlama
      const formattedTime = selectedTime.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      setEndTime(formattedTime);
    }
    
    if (Platform.OS === 'android') {
      setEndTimePickerVisible(false);
    }
  };
  
  // Simge seçimi
  const handleIconSelect = (iconKey) => {
    setSelectedIcon(iconKey);
    setIconModalVisible(false);
  };
  
  // Etkinlik türü seçimi
  const handleEventTypeSelect = (typeId) => {
    setEventType(typeId);
    setEventTypeModalVisible(false);
  };
  
  // Hatırlatma seçimi
  const handleReminderSelect = (option) => {
    setReminderOption(option);
    setReminderModalVisible(false);
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
          <Text style={styles.headerTitle}>Yeni Etkinlik</Text>
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

          {/* Etkinlik Türü Seçimi */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Etkinlik Türü</Text>
            <TouchableOpacity 
              style={styles.selector}
              onPress={() => setEventTypeModalVisible(true)}
            >
              <View style={styles.eventTypeLabel}>
                {eventType && (
                  <View style={[styles.eventTypeIndicator, { backgroundColor: eventTypes.find(et => et.id === eventType)?.color }]} />
                )}
                <Text style={styles.selectorText}>
                  {eventType ? eventTypes.find(et => et.id === eventType)?.name : 'Etkinlik türü seç'}
                </Text>
              </View>
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
              onPress={() => setDatePickerVisible(true)}
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
                onPress={() => setStartTimePickerVisible(true)}
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
                  onPress={() => setEndTimePickerVisible(true)}
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

          {/* Konum */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Konum</Text>
            <TouchableOpacity style={styles.selector}>
              <View style={styles.selectorIconContainer}>
                <Ionicons name="location-outline" size={22} color="#666" />
              </View>
              <TextInput
                style={styles.selectorInput}
                placeholder="Konum ekle"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#AAAAAA"
              />
            </TouchableOpacity>
          </View>

          {/* Katılımcılar */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Katılımcılar</Text>
            <TouchableOpacity style={styles.selector}>
              <View style={styles.selectorIconContainer}>
                <Ionicons name="people-outline" size={22} color="#666" />
              </View>
              <Text style={styles.selectorText}>
                {participants.length > 0 ? `${participants.length} kişi` : 'Katılımcı ekle'}
              </Text>
              <Ionicons name="add-circle-outline" size={22} color="#3B82F6" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
      
      {/* Etkinlik Türü Seçim Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={eventTypeModalVisible}
        onRequestClose={() => setEventTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reminderModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Etkinlik Türü</Text>
              <TouchableOpacity onPress={() => setEventTypeModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reminderOptions}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.reminderOption,
                    eventType === type.id && styles.selectedReminderOption,
                    { borderLeftWidth: 4, borderLeftColor: type.color }
                  ]}
                  onPress={() => handleEventTypeSelect(type.id)}
                >
                  <Text style={[
                    styles.reminderOptionText,
                    eventType === type.id && { color: type.color, fontWeight: '600' }
                  ]}>
                    {type.name}
                  </Text>
                  {eventType === type.id && (
                    <Ionicons name="checkmark" size={18} color={type.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Tarih Seçim Modalı */}
      {datePickerVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={datePickerVisible}
          onRequestClose={() => setDatePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tarih Seç</Text>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                testID="datePicker"
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={handleDateChange}
                style={styles.datePicker}
              />
              
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.dateConfirmButton}
                  onPress={() => setDatePickerVisible(false)}
                >
                  <Text style={styles.dateConfirmButtonText}>Tamam</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Başlangıç Saati Seçim Modalı */}
      {startTimePickerVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={startTimePickerVisible}
          onRequestClose={() => setStartTimePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.timePickerContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Başlangıç Saati</Text>
                <TouchableOpacity onPress={() => setStartTimePickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                testID="startTimePicker"
                value={startTimeValue}
                mode="time"
                display="spinner"
                onChange={handleStartTimeChange}
                style={styles.timePicker}
                is24Hour={true}
              />
              
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.dateConfirmButton}
                  onPress={() => setStartTimePickerVisible(false)}
                >
                  <Text style={styles.dateConfirmButtonText}>Tamam</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
      
      {/* Bitiş Saati Seçim Modalı */}
      {endTimePickerVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={endTimePickerVisible}
          onRequestClose={() => setEndTimePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.timePickerContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Bitiş Saati</Text>
                <TouchableOpacity onPress={() => setEndTimePickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                testID="endTimePicker"
                value={endTimeValue}
                mode="time"
                display="spinner"
                onChange={handleEndTimeChange}
                style={styles.timePicker}
                is24Hour={true}
              />
              
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.dateConfirmButton}
                  onPress={() => setEndTimePickerVisible(false)}
                >
                  <Text style={styles.dateConfirmButtonText}>Tamam</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
      
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
    </SafeAreaView>
  );
};

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
  eventTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  eventTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  eventTypeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  eventTypeName: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  eventTypeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
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
  selectorInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
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
  datePickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 350 : 450,
  },
  timePickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    minHeight: 300,
  },
  reminderModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '60%',
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
  datePicker: {
    width: Platform.OS === 'ios' ? 320 : '100%',
    height: Platform.OS === 'ios' ? 220 : 350,
    marginBottom: 10,
  },
  timePicker: {
    width: Platform.OS === 'ios' ? 320 : '100%',
    height: 200,
  },
  dateConfirmButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 15,
  },
  dateConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddEventScreen; 