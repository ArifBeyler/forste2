import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
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
const JOURNAL_STORAGE_KEY = 'user_journal';

// Ekran genişliği
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 2;
const GRID_SPACING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - (GRID_COLUMNS - 1) * GRID_SPACING) / GRID_COLUMNS;

// Günlük kategorileri ve renkleri
const JOURNAL_CATEGORIES = {
  'Kişisel': '#9E2C21', // Brick Red
  'Düşünceler': '#305853', // Deep Teal
  'Hedefler': '#B06821', // Golden Amber
  'Hayaller': '#511B18', // Dark Mahogany
  'Genel': '#1B2A30', // Slate Blue
};

// Helper function to prepare grid data
const prepareGridItems = (entries) => {
  if (!entries || entries.length === 0) return [];
  
  // Process entries for grid view
  let gridItems = [];
  let currentPair = [];
  
  entries.forEach((entry, index) => {
    if (entry.layoutType === 'horizontal') {
      // Eğer yatay kutucuk varsa, önce çift kutucukları temizle
      if (currentPair.length > 0) {
        gridItems.push({
          type: 'pair',
          items: [...currentPair],
          id: `pair_${currentPair[0].id}`
        });
        currentPair = [];
      }
      
      // Yatay kutucuğu ekle
      gridItems.push({
        type: 'horizontal',
        item: entry,
        id: `horizontal_${entry.id}`
      });
    } else {
      // Kare kutucuklar
      currentPair.push(entry);
      
      // İki kare kutucuk dolduğunda, bir çift olarak ekle
      if (currentPair.length === 2) {
        gridItems.push({
          type: 'pair',
          items: [...currentPair],
          id: `pair_${currentPair[0].id}`
        });
        currentPair = [];
      }
    }
  });
  
  // Eğer tek kalan kare kutucuk varsa, onu da ekle
  if (currentPair.length > 0) {
    gridItems.push({
      type: 'pair',
      items: [...currentPair],
      id: `pair_${currentPair[0].id}`
    });
  }
  
  return gridItems;
};

export default function JournalScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryPhoto, setEntryPhoto] = useState(null);
  const [entryLocation, setEntryLocation] = useState(null);
  
  // Animasyon değeri
  const addButtonScale = useSharedValue(1);
  const addButtonRotation = useSharedValue(0);
  
  // Animasyonu tetikle
  const animateAddButton = () => {
    addButtonScale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    addButtonRotation.value = withSequence(
      withTiming(0.1, { duration: 100 }),
      withTiming(-0.1, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  };
  
  // JournalDetailScreen'den yenileme isteği gelirse kayıtları güncelle
  useEffect(() => {
    if (route.params?.refresh) {
      loadEntries();
    }
    
    if (route.params?.editEntry) {
      openEditMode(route.params.editEntry);
    }
  }, [route.params]);
  
  // Günlük kayıtlarını yükle
  useEffect(() => {
    loadEntries();
  }, []);
  
  // Günlük kayıtlarının sıralamasını yeniden düzenleyen function
  const reorderEntries = (entries) => {
    if (!entries || entries.length === 0) return [];
    
    // Önce son eklenen fotoğraflı günlüğü en üste al
    const entriesCopy = [...entries];
    
    // Fotoğraflı ve fotoğrafsız günlükleri ayır
    const entriesWithPhotos = entriesCopy.filter(entry => entry.photo);
    const entriesWithoutPhotos = entriesCopy.filter(entry => !entry.photo);
    
    // Yeni diziye aktarılacak günlükler
    let result = [];
    
    // Fotoğraflı günlükler varsa işle
    if (entriesWithPhotos.length > 0) {
      // En son eklenen günlüğü bul (createdAt değerine göre)
      entriesWithPhotos.sort((a, b) => b.createdAt - a.createdAt);
      
      // En son eklenen fotoğraflı günlüğü yatay olarak işaretle ve en üste ekle
      const latestEntry = {...entriesWithPhotos[0], layoutType: 'horizontal'};
      result.push(latestEntry);
      
      // Diğer fotoğraflı günlükleri ekle
      const otherEntries = entriesWithPhotos.slice(1);
      result = [...result, ...otherEntries];
    }
    
    // Fotoğrafsız günlükleri en sona ekle
    result = [...result, ...entriesWithoutPhotos];
    
    return result;
  };
  
  // Günlük kayıtlarını filtrele
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(entry => 
        entry.title.toLowerCase().includes(searchText.toLowerCase()) || 
        entry.content.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredEntries(filtered);
    }
  }, [entries, searchText]);
  
  // Günlük kayıtlarını AsyncStorage'dan yükle
  const loadEntries = async () => {
    try {
      const userJournalKey = `${JOURNAL_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      const savedEntries = await AsyncStorage.getItem(userJournalKey);
      
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);
        // En son güncellenen kayıtları üste getir
        const sortedEntries = parsedEntries.sort((a, b) => b.updatedAt - a.updatedAt);
        setEntries(sortedEntries);
        setFilteredEntries(sortedEntries);
      } else {
        // İlk kullanım için örnek günlük kayıtları
        const dummyEntries = generateDummyEntries();
        setEntries(dummyEntries);
        setFilteredEntries(dummyEntries);
        await saveEntries(dummyEntries);
      }
    } catch (error) {
      console.error('Günlük kayıtları yüklenirken hata:', error);
      Alert.alert(
        "Hata", 
        "Günlük kayıtları yüklenirken bir sorun oluştu."
      );
    }
  };

  // Örnek günlük kayıtları oluştur
  const generateDummyEntries = () => {
    const now = Date.now();
    return [
      {
        id: '1',
        title: 'Bugün nasıl hissediyorum',
        content: 'Bugün kendimi gerçekten enerjik hissediyorum. Sabah yürüyüşü yapmak için erken kalktım ve güzel bir kahvaltı hazırladım.',
        category: 'Kişisel',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        title: 'Gelecek planlarım',
        content: 'Gelecek ay için yeni bir projeye başlamayı düşünüyorum. Bu konuda biraz araştırma yapmam gerekiyor.',
        category: 'Hedefler',
        createdAt: now - 86400000,
        updatedAt: now - 86400000
      },
      {
        id: '3',
        title: 'Düşündüklerim',
        content: 'Son günlerde okuduğum kitap beni gerçekten düşündürdü. İnsanların hayatlarında neden farklı kararlar aldıklarını anlamaya çalışıyorum.',
        category: 'Düşünceler',
        createdAt: now - 172800000,
        updatedAt: now - 172800000
      },
      {
        id: '4',
        title: 'Yeni bir gün, yeni bir başlangıç',
        content: 'Her yeni gün, yeni bir başlangıç için bir fırsat. Bugün kendime biraz zaman ayırmak istiyorum.',
        category: 'Genel',
        createdAt: now - 259200000,
        updatedAt: now - 259200000
      },
    ];
  };
  
  // Günlük kayıtlarını kaydet
  const saveEntries = async (updatedEntries) => {
    try {
      const userJournalKey = `${JOURNAL_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      await AsyncStorage.setItem(userJournalKey, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Günlük kayıtları kaydedilirken hata:', error);
      Alert.alert(
        "Hata", 
        "Günlük kayıtları kaydedilirken bir sorun oluştu."
      );
    }
  };
  
  // Günlük kaydını kaydet
  const saveEntry = async () => {
    if (!entryTitle.trim()) {
      Alert.alert("Hata", "Günlük başlığı boş olamaz.");
      return;
    }
    
    try {
      let updatedEntries = [...entries];
      const now = Date.now();
      let newEntryId = now.toString();
      
      if (editingEntry) {
        // Mevcut kaydı düzenle
        const index = updatedEntries.findIndex(entry => entry.id === editingEntry.id);
        if (index !== -1) {
          updatedEntries[index] = {
            ...updatedEntries[index],
            title: entryTitle,
            content: entryContent,
            category: 'Genel',
            photo: entryPhoto,
            location: entryLocation,
            updatedAt: now,
            layoutType: entryPhoto ? 'horizontal' : null
          };
          newEntryId = editingEntry.id;
        }
      } else {
        // Yeni kayıt ekle
        const newEntry = {
          id: newEntryId,
          title: entryTitle,
          content: entryContent,
          category: 'Genel',
          photo: entryPhoto,
          location: entryLocation,
          createdAt: now,
          updatedAt: now,
          layoutType: entryPhoto ? 'horizontal' : null
        };
        
        // Yeni kaydı listenin başına ekle
        updatedEntries = [newEntry, ...updatedEntries];
      }
      
      // State'i güncelle ve kaydet
      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);
      await saveEntries(updatedEntries);
      
      // Formu temizle ve modalı kapat
      setModalVisible(false);
      clearForm();
      
    } catch (error) {
      console.error('Günlük kaydedilirken hata:', error);
      Alert.alert(
        "Hata", 
        "Günlük kaydedilirken bir sorun oluştu."
      );
    }
  };
  
  // Günlük kaydını sil
  const deleteEntry = (entryId) => {
    Alert.alert(
      "Günlük Kaydını Sil",
      "Bu günlük kaydını silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              const updatedEntries = entries.filter(entry => entry.id !== entryId);
              setEntries(updatedEntries);
              setFilteredEntries(updatedEntries.filter(entry => 
                searchText === '' || 
                entry.title.toLowerCase().includes(searchText.toLowerCase()) || 
                entry.content.toLowerCase().includes(searchText.toLowerCase())
              ));
              await saveEntries(updatedEntries);
            } catch (error) {
              console.error('Günlük kaydı silinirken hata:', error);
              Alert.alert(
                "Hata", 
                "Günlük kaydı silinirken bir sorun oluştu."
              );
            }
          }
        }
      ]
    );
  };
  
  // Formu temizle
  const clearForm = () => {
    setEntryTitle('');
    setEntryContent('');
    setEntryPhoto(null);
    setEntryLocation(null);
    setEditingEntry(null);
  };
  
  // Günlük kaydı düzenleme modunu aç
  const openEditMode = (entry) => {
    setEditingEntry(entry);
    setEntryTitle(entry.title);
    setEntryContent(entry.content);
    setEntryPhoto(entry.photo || null);
    setEntryLocation(entry.location || null);
    setModalVisible(true);
  };
  
  // Günlük kaydı ekleme modunu aç
  const openAddMode = () => {
    clearForm();
    setModalVisible(true);
    
    // Buton animasyonu
    animateAddButton();
  };
  
  // Fotoğraf ekle
  const pickImage = async () => {
    // İzin iste
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("İzin gerekli", "Fotoğraf eklemek için galeri erişim izni vermeniz gerekiyor.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setEntryPhoto(result.assets[0].uri);
    }
  };
  
  // Kamera ile fotoğraf çek
  const takePhoto = async () => {
    // İzin iste
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("İzin gerekli", "Fotoğraf çekmek için kamera erişim izni vermeniz gerekiyor.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setEntryPhoto(result.assets[0].uri);
    }
  };
  
  // Konum ekle
  const addLocation = async () => {
    // İzin iste
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert("İzin gerekli", "Konum eklemek için izin vermeniz gerekiyor.");
      return;
    }
    
    try {
      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (geocode && geocode.length > 0) {
        const address = geocode[0];
        const locationString = [
          address.city, 
          address.district,
          address.street
        ].filter(Boolean).join(", ");
        
        setEntryLocation({
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
          address: locationString
        });
      }
    } catch (error) {
      Alert.alert("Hata", "Konum bilgisi alınamadı. Lütfen tekrar deneyin.");
      console.error("Konum hatası:", error);
    }
  };
  
  // Fotoğrafı kaldır
  const removePhoto = () => {
    Alert.alert(
      "Fotoğrafı Kaldır", 
      "Bu fotoğrafı kaldırmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { text: "Kaldır", style: "destructive", onPress: () => setEntryPhoto(null) }
      ]
    );
  };
  
  // Konumu kaldır
  const removeLocation = () => {
    Alert.alert(
      "Konumu Kaldır", 
      "Bu konumu kaldırmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { text: "Kaldır", style: "destructive", onPress: () => setEntryLocation(null) }
      ]
    );
  };
  
  // Tarih formatı
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
    });
  };
  
  // Animasyon stili
  const addButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: addButtonScale.value },
        { rotate: `${addButtonRotation.value * 30}deg` }
      ],
    };
  });
  
  // Tüm günlükleri silme fonksiyonu
  const deleteAllEntries = () => {
    Alert.alert(
      "Tüm Günlükleri Sil",
      "Tüm günlük kayıtlarınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              // Günlükleri sil
              setEntries([]);
              setFilteredEntries([]);
              
              // AsyncStorage'dan tüm günlükleri sil
              const userJournalKey = `${JOURNAL_STORAGE_KEY}_${user?.id || 'anonymous'}`;
              await AsyncStorage.removeItem(userJournalKey);
              
              // Başarılı mesajı göster
              Alert.alert("Başarılı", "Tüm günlük kayıtları silindi.");
            } catch (error) {
              console.error('Günlük kayıtları silinirken hata:', error);
              Alert.alert(
                "Hata", 
                "Günlük kayıtları silinirken bir sorun oluştu."
              );
            }
          }
        }
      ]
    );
  };
  
  // Günlük kartını render et
  const renderEntryItem = ({ item, index }) => {
    const backgroundColor = '#FFFFFF';
    const borderColor = JOURNAL_CATEGORIES[item.category] || JOURNAL_CATEGORIES['Genel'];
    const hasPhoto = !!item.photo;
    
    const handleItemPress = () => {
      navigation.navigate('JournalDetail', { entry: item });
    };
    
    if (hasPhoto) {
      // Fotoğraflı günlük kartı
      return (
        <TouchableOpacity 
          onPress={handleItemPress}
          onLongPress={() => openEditMode(item)}
          activeOpacity={0.8}
          style={{ width: CARD_WIDTH }}
        >
          <Animated.View 
            entering={FadeIn.delay(index * 100).duration(600)}
            style={[styles.entryCard, { backgroundColor }]}
          >
            <View style={[styles.entryCardCategoryBar, { backgroundColor: borderColor }]} />
            <View style={[styles.entryCardGlow, { shadowColor: borderColor }]} />
            <View style={styles.entryCardInner}>
              {/* Fotoğraf */}
              <View style={styles.entryPhotoContainer}>
                <Image source={{ uri: item.photo }} style={styles.entryPhoto} />
              </View>
              
              {/* Çizgi */}
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              
              {/* Başlık ve duygu durumu */}
              <View style={styles.entryHeaderContainer}>
                <Text style={styles.entryTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      );
    } else {
      // Fotoğrafsız günlük kartı
      return (
        <TouchableOpacity 
          onPress={handleItemPress}
          onLongPress={() => openEditMode(item)}
          activeOpacity={0.8}
          style={{ width: CARD_WIDTH }}
        >
          <Animated.View 
            entering={FadeIn.delay(index * 100).duration(600)}
            style={[styles.entryCard, { backgroundColor }]}
          >
            <View style={[styles.entryCardCategoryBar, { backgroundColor: borderColor }]} />
            <View style={[styles.entryCardGlow, { shadowColor: borderColor }]} />
            <View style={styles.entryCardInner}>
              <View style={styles.entryHeaderContainer}>
                <Text style={styles.entryTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              
              <Text style={styles.entryContent} numberOfLines={3}>
                {item.content}
              </Text>
              
              <Text style={styles.entryDate}>
                {formatDate(item.updatedAt)}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      );
    }
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
          <Ionicons name="chevron-back" size={24} color="#9E2C21" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Günlüğüm</Text>
        
        <TouchableOpacity 
          style={styles.deleteAllButton}
          onPress={deleteAllEntries}
        >
          <Ionicons 
            name="trash" 
            size={24} 
            color="#9E2C21" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Günlükte ara..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchText('')}
            style={styles.clearSearchButton}
          >
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Günlük Kayıtları Listesi */}
      <View style={styles.content}>
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchText ? 'Arama sonucu bulunamadı' : 'Henüz günlük kaydı eklenmemiş'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchText 
                ? `"${searchText}" için sonuç bulunamadı`
                : 'Günlük kayıtlarınızı eklemek için sağ alt köşedeki + butonuna dokunun'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEntries}
            renderItem={renderEntryItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.entriesList}
            columnWrapperStyle={styles.entriesRow}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Günlük Kaydı Ekleme Butonu */}
      <Animated.View style={[styles.fabContainer, addButtonAnimatedStyle]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={openAddMode}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Günlük Kaydı Ekleme/Düzenleme Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => {
          setModalVisible(false);
          clearForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContainer}>
              <View style={[
                styles.statusBarPlaceholder, 
                { height: Platform.OS === 'ios' ? 50 : 0 }
              ]} />
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setModalVisible(false);
                    clearForm();
                  }}
                >
                  <Text style={styles.modalButtonText}>✕</Text>
                </TouchableOpacity>
                
                <Text style={styles.modalTitle}>
                  {editingEntry ? 'Günlük Kaydını Düzenle' : 'Yeni Günlük Kaydı'}
                </Text>
                
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={saveEntry}
                >
                  <Text style={styles.modalButtonTextPrimary}>✓</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalDivider} />
              
              <View style={styles.modalForm}>
                <TextInput
                  style={styles.titleInput}
                  value={entryTitle}
                  onChangeText={setEntryTitle}
                  placeholder="Başlık"
                  placeholderTextColor="#9CA3AF"
                  maxLength={50}
                  autoFocus={true}
                />
                
                {/* Fotoğraf, Duygu ve Konum Araç Çubuğu */}
                <View style={styles.toolbarContainer}>
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="image-outline" size={24} color="#FF6B95" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera-outline" size={24} color="#FF6B95" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={addLocation}
                  >
                    <Ionicons name="location-outline" size={24} color="#FF6B95" />
                  </TouchableOpacity>
                </View>
                
                {/* Eklenen Fotoğraf Önizlemesi */}
                {entryPhoto && (
                  <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: entryPhoto }} style={styles.photoPreview} />
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={removePhoto}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF6B95" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Eklenen Konum Gösterimi */}
                {entryLocation && (
                  <View style={styles.locationBadge}>
                    <Ionicons name="location" size={16} color="#FF6B95" />
                    <Text style={styles.locationBadgeText} numberOfLines={1}>
                      {entryLocation.address}
                    </Text>
                    <TouchableOpacity onPress={removeLocation}>
                      <Ionicons name="close-circle" size={22} color="#FF6B95" />
                    </TouchableOpacity>
                  </View>
                )}
                
                <TextInput
                  style={styles.contentInput}
                  value={entryContent}
                  onChangeText={setEntryContent}
                  placeholder="Bugün neler oldu? Neler hissediyorsun?"
                  placeholderTextColor="#9CA3AF"
                  multiline={true}
                  textAlignVertical="top"
                />
                
                {/* En alta extra boşluk ekleyelim ki klavye açıkken de tüm içeriği görebilelim */}
                <View style={{ height: 150 }} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF6B95',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#1F2937',
    height: '100%',
  },
  clearSearchButton: {
    padding: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  entriesList: {
    paddingBottom: 80,
  },
  entriesRow: {
    justifyContent: 'space-between',
    marginBottom: GRID_SPACING,
  },
  entryCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    height: 160,
  },
  entryCardCategoryBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 1,
  },
  entryCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  entryCardInner: {
    padding: 16,
    height: '100%',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  entryHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    flex: 1,
  },
  entryContent: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  entryDate: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  entryPhotoContainer: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  entryPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 6,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9E2C21', // Brick Red rengi
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9E2C21', // Gölge rengi
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusBarPlaceholder: {
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 5,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginTop: 8,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 22,
    color: '#555',
  },
  modalButtonTextPrimary: {
    fontSize: 24,
    color: '#9E2C21', // Brick Red rengi ile değiştirildi
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  modalSaveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalForm: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '500',
    color: '#1F2937',
    paddingVertical: 12,
    marginBottom: 12,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    textAlignVertical: 'top',
    paddingTop: 8,
    paddingBottom: 16,
  },
  toolbarContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#FFF0F5',
  },
  photoPreviewContainer: {
    width: '100%',
    height: 180,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
    marginRight: 8,
  },
  locationBadgeText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    marginHorizontal: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 10,
    color: '#4B5563',
    marginLeft: 2,
    flex: 1,
  }
}); 