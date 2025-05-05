import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
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
const NOTES_STORAGE_KEY = 'user_notes';

// Ekran genişliği
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 2;
const GRID_SPACING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - (GRID_COLUMNS - 1) * GRID_SPACING) / GRID_COLUMNS;

// Not kategorileri ve renkleri
const CATEGORY_COLORS = {
  'Kişisel': '#FFCDD2', // Açık Kırmızı
  'İş': '#FFECB3', // Açık Sarı
  'Alışveriş': '#C8E6C9', // Açık Yeşil
  'Sağlık': '#D1C4E9', // Açık Mor
  'Diğer': '#B3E5FC', // Açık Mavi
};

export default function NotesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('Kişisel');
  
  // Animasyon değeri
  const addButtonScale = useSharedValue(1);
  
  // Notları yükle
  useEffect(() => {
    loadNotes();
  }, []);
  
  // Notları filtrele
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(searchText.toLowerCase()) || 
        note.content.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredNotes(filtered);
    }
  }, [notes, searchText]);
  
  // Notları AsyncStorage'dan yükle
  const loadNotes = async () => {
    try {
      const userNotesKey = `${NOTES_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      const savedNotes = await AsyncStorage.getItem(userNotesKey);
      
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        // En son güncellenen notları üste getir
        const sortedNotes = parsedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
        setNotes(sortedNotes);
        setFilteredNotes(sortedNotes);
      } else {
        // İlk kullanım için örnek notlar
        const dummyNotes = generateDummyNotes();
        setNotes(dummyNotes);
        setFilteredNotes(dummyNotes);
        await saveNotes(dummyNotes);
      }
    } catch (error) {
      console.error('Notlar yüklenirken hata:', error);
      Alert.alert(
        "Hata", 
        "Notlar yüklenirken bir sorun oluştu."
      );
    }
  };

  // Örnek notlar oluştur
  const generateDummyNotes = () => {
    const now = Date.now();
    return [
      {
        id: '1',
        title: 'Lorem ipsum',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis commodo dapibus justo id vestibulum.',
        category: 'Kişisel',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        title: 'Lorem ipsum',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        category: 'Alışveriş',
        createdAt: now - 86400000,
        updatedAt: now - 86400000
      },
      {
        id: '3',
        title: 'Lorem ipsum',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis commodo dapibus justo id vestibulum.',
        category: 'İş',
        createdAt: now - 172800000,
        updatedAt: now - 172800000
      },
      {
        id: '4',
        title: 'Lorem ipsum dolor sit amet',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis commodo dapibus justo id vestibulum.',
        category: 'Sağlık',
        createdAt: now - 259200000,
        updatedAt: now - 259200000
      },
      {
        id: '5',
        title: 'Lorem ipsum',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis commodo dapibus justo id vestibulum.',
        category: 'Diğer',
        createdAt: now - 345600000,
        updatedAt: now - 345600000
      },
      {
        id: '6',
        title: 'Lorem ipsum',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        category: 'Kişisel',
        createdAt: now - 432000000,
        updatedAt: now - 432000000
      },
    ];
  };
  
  // Notları kaydet
  const saveNotes = async (updatedNotes) => {
    try {
      const userNotesKey = `${NOTES_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      await AsyncStorage.setItem(userNotesKey, JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('Notlar kaydedilirken hata:', error);
      Alert.alert(
        "Hata", 
        "Notlar kaydedilirken bir sorun oluştu."
      );
    }
  };
  
  // Notu kaydet
  const saveNote = async () => {
    if (!noteTitle.trim()) {
      Alert.alert("Hata", "Not başlığı boş olamaz.");
      return;
    }
    
    try {
      let updatedNotes = [...notes];
      const now = Date.now();
      
      if (editingNote) {
        // Mevcut notu düzenle
        const index = updatedNotes.findIndex(note => note.id === editingNote.id);
        if (index !== -1) {
          updatedNotes[index] = {
            ...updatedNotes[index],
            title: noteTitle,
            content: noteContent,
            category: noteCategory,
            updatedAt: now
          };
        }
      } else {
        // Yeni not ekle
        const newNote = {
          id: now.toString(),
          title: noteTitle,
          content: noteContent,
          category: noteCategory,
          createdAt: now,
          updatedAt: now
        };
        
        // Yeni notu listenin başına ekle
        updatedNotes = [newNote, ...updatedNotes];
      }
      
      // State'i güncelle ve kaydet
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);
      await saveNotes(updatedNotes);
      
      // Formu temizle ve modalı kapat
      clearForm();
      setModalVisible(false);
    } catch (error) {
      console.error('Not kaydedilirken hata:', error);
      Alert.alert(
        "Hata", 
        "Not kaydedilirken bir sorun oluştu."
      );
    }
  };
  
  // Notu sil
  const deleteNote = (noteId) => {
    Alert.alert(
      "Notu Sil",
      "Bu notu silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              const updatedNotes = notes.filter(note => note.id !== noteId);
              setNotes(updatedNotes);
              setFilteredNotes(updatedNotes.filter(note => 
                searchText === '' || 
                note.title.toLowerCase().includes(searchText.toLowerCase()) || 
                note.content.toLowerCase().includes(searchText.toLowerCase())
              ));
              await saveNotes(updatedNotes);
            } catch (error) {
              console.error('Not silinirken hata:', error);
              Alert.alert(
                "Hata", 
                "Not silinirken bir sorun oluştu."
              );
            }
          }
        }
      ]
    );
  };
  
  // Formu temizle
  const clearForm = () => {
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('Kişisel');
    setEditingNote(null);
  };
  
  // Not düzenleme modunu aç
  const openEditMode = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category || 'Kişisel');
    setModalVisible(true);
  };
  
  // Not ekleme modunu aç
  const openAddMode = () => {
    clearForm();
    setModalVisible(true);
    
    // Buton animasyonu
    addButtonScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(1, { duration: 150 })
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
      transform: [{ scale: addButtonScale.value }]
    };
  });
  
  // Not kartını render et
  const renderNoteItem = ({ item, index }) => {
    const backgroundColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Diğer'];
    
    return (
      <Animated.View 
        entering={FadeIn.delay(index * 50).duration(300)}
        style={[styles.noteCard, { width: CARD_WIDTH, backgroundColor }]}
      >
        <TouchableOpacity 
          style={styles.noteCardInner}
          onPress={() => navigation.navigate('NotesDetail', { note: item })}
          activeOpacity={0.8}
        >
          <Text style={styles.noteTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          <Text style={styles.noteContent} numberOfLines={3}>
            {item.content}
          </Text>
          
          <Text style={styles.noteDate}>
            {formatDate(item.updatedAt)}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Rastgele renk oluştur
  const getRandomColor = () => {
    const colors = ['#FFCDD2', '#FFECB3', '#C8E6C9', '#D1C4E9', '#B3E5FC', 
                   '#FFCCBC', '#F0F4C3', '#CFD8DC', '#BBD8FA', '#E1BEE7'];
    return colors[Math.floor(Math.random() * colors.length)];
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
          <Ionicons name="chevron-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notlarım</Text>
        
        <TouchableOpacity style={styles.profileButton}>
          <Image 
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
            style={styles.profileImage} 
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
          placeholder="Notlarda ara..."
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
      
      {/* Notlar Listesi */}
      <View style={styles.content}>
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchText ? 'Arama sonucu bulunamadı' : 'Henüz not eklenmemiş'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchText 
                ? `"${searchText}" için sonuç bulunamadı`
                : 'Notlarınızı eklemek için sağ alt köşedeki + butonuna dokunun'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotes}
            renderItem={renderNoteItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.notesList}
            columnWrapperStyle={styles.notesRow}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Not Ekleme Butonu */}
      <Animated.View style={[styles.fabContainer, addButtonAnimatedStyle]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={openAddMode}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Not Ekleme/Düzenleme Modal */}
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
              {editingNote ? 'Notu Düzenle' : 'Yeni Not'}
            </Text>
            
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={saveNote}
            >
              <Text style={styles.modalButtonTextPrimary}>✓</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalDivider} />
          
          <View style={styles.modalForm}>
            <TextInput
              style={styles.titleInput}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Başlık"
              placeholderTextColor="#9CA3AF"
              maxLength={50}
              autoFocus={true}
            />
            
            <View style={styles.categoryScrollContainer}>
              <View style={styles.categorySelector}>
                {Object.keys(CATEGORY_COLORS).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: CATEGORY_COLORS[category] },
                      noteCategory === category && styles.selectedCategoryChip
                    ]}
                    onPress={() => setNoteCategory(category)}
                  >
                    <Text style={styles.categoryText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TextInput
              style={styles.contentInput}
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="Not içeriği"
              placeholderTextColor="#9CA3AF"
              multiline={true}
              textAlignVertical="top"
            />
          </View>
        </View>
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
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3B82F6',
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
  notesList: {
    paddingBottom: 80,
  },
  notesRow: {
    justifyContent: 'space-between',
    marginBottom: GRID_SPACING,
  },
  noteCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteCardInner: {
    padding: 16,
    height: 160,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'right',
    marginTop: 8,
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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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
    color: '#007AFF',
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
    marginBottom: 24,
  },
  categoryScrollContainer: {
    marginBottom: 24,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategoryChip: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
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
}); 