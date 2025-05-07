import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
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

// Sabitler - Zenginleştirilmiş etkinlik türleri
const EVENT_TYPES = {
  PERSONAL_DEV: 'personal_dev',  // Kişisel Gelişim
  SPORT: 'sport',                // Spor
  WORK: 'work',                  // İş / Üretkenlik
  RELATIONSHIP: 'relationship',  // İlişkisel
  MEETING: 'meeting',            // Toplantı  
  EDUCATION: 'education',        // Eğitim/Okul
  HOMEWORK: 'homework',          // Ödev
  PROJECT: 'project',            // Proje
  HOME: 'home',                  // Ev İşleri
  SHOPPING: 'shopping',          // Alışveriş
  HEALTH: 'health',              // Sağlık
  SOCIAL: 'social'               // Sosyal Aktivite
};

// Etkinlik tipleri için renkler
const EVENT_COLORS = {
  personal_dev: '#FF6384',  // Kişisel Gelişim - Pembe/Kırmızı
  sport: '#36A2EB',         // Spor - Mavi
  work: '#FFCE56',          // İş / Üretkenlik - Sarı
  relationship: '#4BC0C0',  // İlişkisel - Turkuaz
  meeting: '#9966FF',       // Toplantı - Mor
  education: '#66CC99',     // Eğitim/Okul - Yeşil
  homework: '#FF9966',      // Ödev - Turuncu
  project: '#C9CBCF',       // Proje - Gri
  home: '#6699CC',          // Ev İşleri - Mavi Gri
  shopping: '#CC99FF',      // Alışveriş - Lavanta
  health: '#FF6666',        // Sağlık - Kırmızı
  social: '#66CCFF'         // Sosyal Aktivite - Açık Mavi
};

// Etkinlik tipleri için ikonlar
const EVENT_ICONS = {
  personal_dev: 'book-outline',        // Kişisel Gelişim
  sport: 'fitness-outline',            // Spor
  work: 'briefcase-outline',           // İş
  relationship: 'people-outline',      // İlişkisel
  meeting: 'calendar-outline',         // Toplantı
  education: 'school-outline',         // Eğitim/Okul
  homework: 'document-text-outline',   // Ödev
  project: 'construct-outline',        // Proje
  home: 'home-outline',                // Ev İşleri
  shopping: 'cart-outline',            // Alışveriş
  health: 'heart-outline',             // Sağlık
  social: 'people-circle-outline'      // Sosyal Aktivite
};

// Zaman formatlamak için yardımcı fonksiyon
function formatTime(date) {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

const AddEventScreen = ({ navigation, route }) => {
  const { addEvent } = useCalendar();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState(EVENT_TYPES.WORK);
  const [date, setDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState({
    startTime: formatTime(new Date()), 
    endTime: formatTime(new Date(new Date().getTime() + 60 * 60 * 1000)) // 1 saat sonra
  });
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [reminderOption, setReminderOption] = useState(null);
  const [color, setColor] = useState(EVENT_COLORS[EVENT_TYPES.WORK]);
  const [icon, setIcon] = useState(EVENT_ICONS[EVENT_TYPES.WORK]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Modal states
  const [iconModalVisible, setIconModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [eventTypeModalVisible, setEventTypeModalVisible] = useState(false);
  
  // Tarih ve saat değerleri
  const [startTimeValue, setStartTimeValue] = useState(new Date());
  const [endTimeValue, setEndTimeValue] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Hatırlatma seçenekleri
  const reminderOptions = [
    { id: 'on_time', label: 'Zamanında', minutes: 0 },
    { id: '5_min', label: '5 dakika önce', minutes: 5 },
    { id: '10_min', label: '10 dakika önce', minutes: 10 },
    { id: '15_min', label: '15 dakika önce', minutes: 15 },
    { id: '30_min', label: '30 dakika önce', minutes: 30 },
    { id: '1_hour', label: '1 saat önce', minutes: 60 },
  ];

  // Etkinlik türleri - Genişletilmiş ve Türkçe isimlerle
  const eventTypes = [
    { id: EVENT_TYPES.PERSONAL_DEV, name: 'Kişisel Gelişim', color: EVENT_COLORS.personal_dev, icon: EVENT_ICONS.personal_dev },
    { id: EVENT_TYPES.SPORT, name: 'Spor', color: EVENT_COLORS.sport, icon: EVENT_ICONS.sport },
    { id: EVENT_TYPES.WORK, name: 'İş / Üretkenlik', color: EVENT_COLORS.work, icon: EVENT_ICONS.work },
    { id: EVENT_TYPES.RELATIONSHIP, name: 'Buluşma', color: EVENT_COLORS.relationship, icon: EVENT_ICONS.relationship },
    { id: EVENT_TYPES.MEETING, name: 'Toplantı', color: EVENT_COLORS.meeting, icon: EVENT_ICONS.meeting },
    { id: EVENT_TYPES.EDUCATION, name: 'Okul', color: EVENT_COLORS.education, icon: EVENT_ICONS.education },
    { id: EVENT_TYPES.HOMEWORK, name: 'Ödev', color: EVENT_COLORS.homework, icon: EVENT_ICONS.homework },
    { id: EVENT_TYPES.PROJECT, name: 'Proje', color: EVENT_COLORS.project, icon: EVENT_ICONS.project },
    { id: EVENT_TYPES.HOME, name: 'Ev', color: EVENT_COLORS.home, icon: EVENT_ICONS.home },
    { id: EVENT_TYPES.SHOPPING, name: 'Alışveriş', color: EVENT_COLORS.shopping, icon: EVENT_ICONS.shopping },
    { id: EVENT_TYPES.HEALTH, name: 'Sağlık', color: EVENT_COLORS.health, icon: EVENT_ICONS.health },
    { id: EVENT_TYPES.SOCIAL, name: 'Sosyal Aktivite', color: EVENT_COLORS.social, icon: EVENT_ICONS.social }
  ];

  // Etkinlik tipini değiştirince renk ve simge de değişsin
  useEffect(() => {
    setColor(EVENT_COLORS[selectedType]);
    setIcon(EVENT_ICONS[selectedType]);
  }, [selectedType]);

  // Tarihi formatla
  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Etkinlik ekle
  const handleAddEvent = useCallback(async () => {
    // Hata kontrolü
    const formErrors = {};
    if (!title) formErrors.title = 'Başlık gerekli';
    if (!selectedType) formErrors.type = 'Tür seçimi gerekli';

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Saat bilgilerini güvenli şekilde formatlama
      let startTimeFormatted = null;
      let endTimeFormatted = null;
      
      if (!isAllDay && timeRange && timeRange.startTime) {
        startTimeFormatted = timeRange.startTime;
      }
      
      if (!isAllDay && timeRange && timeRange.endTime) {
        endTimeFormatted = timeRange.endTime;
      }
      
      // Etkinlik türüne göre renk belirle
      const eventColor = getEventColor(selectedType);
      
      // Supabase'e eklenecek veri formatına dönüştür
      const newEvent = {
        title,
        description,
        type: selectedType,
        day: date.getDate(),
        date: date.toISOString().split('T')[0], // ISO formatında tarih
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        location,
        isAllDay,
        reminderOption,
        color: eventColor,
        icon: icon || EVENT_ICONS[selectedType] || 'calendar-outline'
      };

      console.log('Yeni etkinlik ekleniyor:', newEvent);
      const result = await addEvent(newEvent);
      console.log('Etkinlik ekleme sonucu:', result);

      if (result && result.success) {
        // Başarılı toast mesajı göster
        setToastMessage('Etkinlik başarıyla eklendi!');
        setToastVisible(true);
        
        // Kısa bir gecikme ile geri dön
        setTimeout(() => {
          navigation.navigate('Calendar', { refreshEvents: Date.now() });
        }, 1000);
      } else {
        Alert.alert('Hata', result?.error || 'Etkinlik eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Etkinlik eklenemedi:', error);
      Alert.alert('Hata', 'Etkinlik eklenirken teknik bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, selectedType, date, timeRange, isAllDay, location, reminderOption, icon, navigation, addEvent]);
  
  // Etkinlik türüne göre renk belirleme
  const getEventColor = (type) => {
    return EVENT_COLORS[type] || '#FFCE56';
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
      
      setTimeRange({
        startTime: formatTime(selectedDate),
        endTime: formatTime(new Date(selectedDate.getTime() + 60 * 60 * 1000)) // 1 saat sonra
      });
    }
  };
  
  // Başlangıç saati değişikliği
  const handleStartTimeChange = (event, selectedTime) => {
    setStartTimePickerVisible(false);
    
    if (selectedTime) {
      setStartTimeValue(selectedTime);
      
      // Saat formatlama
      const formattedTime = selectedTime.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      setTimeRange({
        ...timeRange,
        startTime: formattedTime
      });
    }
  };
  
  // Bitiş saati değişikliği
  const handleEndTimeChange = (event, selectedTime) => {
    setEndTimePickerVisible(false);
    
    if (selectedTime) {
      setEndTimeValue(selectedTime);
      
      // Saat formatlama
      const formattedTime = selectedTime.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      setTimeRange({
        ...timeRange,
        endTime: formattedTime
      });
    }
  };
  
  // Simge seçimi
  const handleIconSelect = (iconKey) => {
    const selectedIcon = icons.find(icon => icon.key === iconKey);
    if (selectedIcon) {
      setIcon(selectedIcon.name);
    }
    setIconModalVisible(false);
  };
  
  // Etkinlik türü seçimi
  const handleEventTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setEventTypeModalVisible(false);
  };
  
  // Hatırlatma seçimi
  const handleReminderSelect = (option) => {
    setReminderOption(option);
    setReminderModalVisible(false);
  };

  // Simge seçenekleri - Kategorilere uygun ikonlar
  const icons = [
    { name: 'book-outline', key: 'personal_dev', label: 'Kişisel Gelişim' },
    { name: 'school-outline', key: 'education', label: 'Eğitim/Okul' },
    { name: 'fitness-outline', key: 'sport', label: 'Spor' },
    { name: 'briefcase-outline', key: 'work', label: 'İş' },
    { name: 'people-outline', key: 'relationship', label: 'Buluşma' },
    { name: 'calendar-outline', key: 'meeting', label: 'Toplantı' },
    { name: 'document-text-outline', key: 'homework', label: 'Ödev' },
    { name: 'construct-outline', key: 'project', label: 'Proje' },
    { name: 'home-outline', key: 'home', label: 'Ev' },
    { name: 'cart-outline', key: 'shopping', label: 'Alışveriş' },
    { name: 'heart-outline', key: 'health', label: 'Sağlık' },
    { name: 'people-circle-outline', key: 'social', label: 'Sosyal Aktivite' },
    { name: 'restaurant-outline', key: 'meal', label: 'Yemek' },
    { name: 'musical-notes-outline', key: 'hobby', label: 'Hobi' },
    { name: 'globe-outline', key: 'travel', label: 'Seyahat' },
  ];

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
                {selectedType && (
                  <View style={[styles.eventTypeIndicator, { backgroundColor: getEventColor(selectedType) }]} />
                )}
                <Text style={styles.selectorText}>
                  {selectedType ? eventTypes.find(et => et.id === selectedType)?.name : 'Etkinlik türü seç'}
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
              {icon ? (
                <View style={styles.selectedIconContainer}>
                  <Ionicons name={icon} size={28} color="#3B82F6" />
                  <Text style={styles.selectedIconText}>
                    {icons.find(item => item.name === icon)?.label || 'Simge Seç'}
                  </Text>
                </View>
              ) : (
                <View style={styles.selectedIconContainer}>
                  <Ionicons name={EVENT_ICONS[selectedType] || 'calendar-outline'} size={28} color="#3B82F6" />
                  <Text style={styles.selectedIconText}>
                    Varsayılan Simge
                  </Text>
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
                {formatDate(date)}
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
                  {timeRange.startTime ? timeRange.startTime : 'Başlangıç saati'}
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
                    {timeRange.endTime ? timeRange.endTime : 'Bitiş saati'}
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
            <TouchableOpacity style={styles.saveButton} onPress={handleAddEvent}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
              
              <ScrollView style={styles.scrollableModalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.iconGrid}>
                  {icons.map((iconItem) => (
                    <TouchableOpacity
                      key={iconItem.key}
                      style={[
                        styles.iconButton,
                        icon === iconItem.name && styles.selectedIconButton
                      ]}
                      onPress={() => handleIconSelect(iconItem.key)}
                    >
                      <Ionicons 
                        name={iconItem.name} 
                        size={24} 
                        color={icon === iconItem.name ? '#fff' : '#555'} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
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
              
              <ScrollView style={styles.scrollableModalContent} showsVerticalScrollIndicator={true}>
                <View style={styles.reminderOptions}>
                  {eventTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.reminderOption,
                        selectedType === type.id && styles.selectedReminderOption,
                        { borderLeftWidth: 4, borderLeftColor: type.color }
                      ]}
                      onPress={() => handleEventTypeSelect(type.id)}
                    >
                      <Text style={[
                        styles.reminderOptionText,
                        selectedType === type.id && { color: type.color, fontWeight: '600' }
                      ]}>
                        {type.name}
                      </Text>
                      {selectedType === type.id && (
                        <Ionicons name="checkmark" size={18} color={type.color} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
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
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerPopup}>
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
                    testID="datePicker"
                    value={date}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => setDate(selectedDate || date)}
                    locale="tr-TR"
                    style={styles.picker}
                    textColor="black"
                  />
                </View>
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
            <TouchableOpacity 
              style={styles.datePickerModal} 
              activeOpacity={1}
              onPress={() => setStartTimePickerVisible(false)}
            >
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
                style={styles.datePickerPopup}
              >
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setStartTimePickerVisible(false)}>
                    <Text style={styles.datePickerCancelText}>İptal</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Başlangıç Saati</Text>
                  <TouchableOpacity onPress={() => {
                    handleStartTimeChange(null, startTimeValue);
                    setStartTimePickerVisible(false);
                  }}>
                    <Text style={styles.datePickerDoneText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    testID="startTimePicker"
                    value={startTimeValue}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      setStartTimeValue(selectedTime || startTimeValue);
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
        
        {/* Bitiş Saati Seçim Modalı */}
        {endTimePickerVisible && (
          <Modal
            animationType="fade"
            transparent={true}
            visible={endTimePickerVisible}
            onRequestClose={() => setEndTimePickerVisible(false)}
          >
            <TouchableOpacity 
              style={styles.datePickerModal} 
              activeOpacity={1}
              onPress={() => setEndTimePickerVisible(false)}
            >
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
                style={styles.datePickerPopup}
              >
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setEndTimePickerVisible(false)}>
                    <Text style={styles.datePickerCancelText}>İptal</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Bitiş Saati</Text>
                  <TouchableOpacity onPress={() => {
                    handleEndTimeChange(null, endTimeValue);
                    setEndTimePickerVisible(false);
                  }}>
                    <Text style={styles.datePickerDoneText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    testID="endTimePicker"
                    value={endTimeValue}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      setEndTimeValue(selectedTime || endTimeValue);
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
              
              <ScrollView style={styles.scrollableModalContent} showsVerticalScrollIndicator={true}>
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
              </ScrollView>
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
  reminderModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  reminderOptions: {
    marginTop: 5,
    paddingBottom: 10,
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
  scrollableModalContent: {
    flexGrow: 1,
  },
});

export default AddEventScreen; 