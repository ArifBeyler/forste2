import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

// AsyncStorage anahtarı
const NOTES_STORAGE_KEY = 'user_notes';

// Not kategorileri ve renkleri
const CATEGORY_COLORS = {
  'Kişisel': '#FFCDD2', // Açık Kırmızı
  'İş': '#FFECB3', // Açık Sarı
  'Alışveriş': '#C8E6C9', // Açık Yeşil
  'Sağlık': '#D1C4E9', // Açık Mor
  'Diğer': '#B3E5FC', // Açık Mavi
};

export default function NotesDetailScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { note } = route.params || {};
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  
  if (!note) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorText}>Not bilgisi bulunamadı</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Kategori rengini al
  const categoryColor = CATEGORY_COLORS[note.category] || CATEGORY_COLORS['Diğer'];
  
  // Paylaşım işlevi
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${note.title}\n\n${note.content}`,
        title: 'Not Paylaşımı'
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };
  
  // Düzenleme modunu açma işlevi
  const openEditMode = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category || 'Diğer');
    setEditModalVisible(true);
  };
  
  // Düzenlemeyi kaydetme işlevi
  const saveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Hata", "Not başlığı boş olamaz.");
      return;
    }
    
    try {
      // Mevcut notları al
      const userNotesKey = `${NOTES_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      const savedNotes = await AsyncStorage.getItem(userNotesKey);
      const notes = savedNotes ? JSON.parse(savedNotes) : [];
      
      // Notu güncelle
      const now = Date.now();
      const updatedNotes = notes.map(item => {
        if (item.id === note.id) {
          return {
            ...item,
            title: editTitle,
            content: editContent,
            category: editCategory,
            updatedAt: now
          };
        }
        return item;
      });
      
      // Kaydet
      await AsyncStorage.setItem(userNotesKey, JSON.stringify(updatedNotes));
      
      // Modalı kapat ve ana sayfaya dön
      setEditModalVisible(false);
      
      // Kullanıcıya bilgi ver
      Alert.alert("Başarılı", "Not güncellendi.", [
        { 
          text: "Tamam", 
          onPress: () => {
            // Notlar ekranına geri dön
            navigation.navigate('Notes', { refresh: true });
          }
        }
      ]);
    } catch (error) {
      console.error('Not güncellenirken hata:', error);
      Alert.alert("Hata", "Not güncellenirken bir sorun oluştu.");
    }
  };
  
  // Notu silme işlevi
  const deleteNote = async () => {
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
              // Mevcut notları al
              const userNotesKey = `${NOTES_STORAGE_KEY}_${user?.id || 'anonymous'}`;
              const savedNotes = await AsyncStorage.getItem(userNotesKey);
              const notes = savedNotes ? JSON.parse(savedNotes) : [];
              
              // Notu sil
              const updatedNotes = notes.filter(item => item.id !== note.id);
              
              // Kaydet
              await AsyncStorage.setItem(userNotesKey, JSON.stringify(updatedNotes));
              
              // Notlar ekranına geri dön
              navigation.navigate('Notes', { refresh: true });
            } catch (error) {
              console.error('Not silinirken hata:', error);
              Alert.alert("Hata", "Not silinirken bir sorun oluştu.");
            }
          }
        }
      ]
    );
  };
  
  // Tarihi formatla
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('tr-TR', options);
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
        
        <Text style={styles.headerTitle}>Not Detayı</Text>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noteCard}>
          {/* Kategori Etiketi */}
          <View style={[styles.categoryChip, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{note.category || 'Diğer'}</Text>
          </View>
          
          {/* Başlık */}
          <Text style={styles.noteTitle}>{note.title}</Text>
          
          {/* Tarih */}
          <Text style={styles.noteDate}>{formatDate(note.updatedAt)}</Text>
          
          {/* İçerik */}
          <Text style={styles.noteContent}>{note.content}</Text>
        </View>
      </ScrollView>
      
      {/* Aksiyon Butonları */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={deleteNote}
        >
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={openEditMode}
        >
          <Ionicons name="pencil" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Düzenleme Modalı */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => setEditModalVisible(false)}
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
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>✕</Text>
                </TouchableOpacity>
                
                <Text style={styles.modalTitle}>Notu Düzenle</Text>
                
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={saveEdit}
                >
                  <Text style={styles.modalButtonTextPrimary}>✓</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalDivider} />
              
              <View style={styles.modalForm}>
                <TextInput
                  style={styles.titleInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Başlık"
                  placeholderTextColor="#9CA3AF"
                  maxLength={50}
                />
                
                <View style={styles.categoryScrollContainer}>
                  <View style={styles.categorySelector}>
                    {Object.keys(CATEGORY_COLORS).map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.modalCategoryChip,
                          { backgroundColor: CATEGORY_COLORS[category] },
                          editCategory === category && styles.selectedCategoryChip
                        ]}
                        onPress={() => setEditCategory(category)}
                      >
                        <Text style={styles.modalCategoryText}>{category}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TextInput
                  style={styles.contentInput}
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="Not içeriği"
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    padding: 4,
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  actionButtonsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    flexDirection: 'row',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginLeft: 12,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Modal stilleri
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
    color: '#3B82F6',
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
    fontSize: 24,
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
  modalCategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategoryChip: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  modalCategoryText: {
    fontSize: 14,
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
    minHeight: 200,
    paddingBottom: 16,
  },
}); 