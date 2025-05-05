import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

// AsyncStorage anahtarı
const JOURNAL_STORAGE_KEY = 'user_journal';

// Ekran genişliği
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Günlük kategorileri ve renkleri
const JOURNAL_CATEGORIES = {
  'Kişisel': '#9E2C21', // Brick Red
  'Düşünceler': '#305853', // Deep Teal
  'Hedefler': '#B06821', // Golden Amber
  'Hayaller': '#511B18', // Dark Mahogany
  'Genel': '#1B2A30', // Slate Blue
};

export default function JournalDetailScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { entry } = route.params || {};
  const [imageExpanded, setImageExpanded] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorText}>Günlük bilgisi bulunamadı</Text>
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
  const categoryColor = JOURNAL_CATEGORIES[entry.category] || JOURNAL_CATEGORIES['Genel'];
  
  // Paylaşım işlevi
  const handleShare = async () => {
    try {
      let shareContent = `${entry.title}\n\n${entry.content}`;
      
      if (entry.location) {
        shareContent += `\n\nKonum: ${entry.location.name}`;
      }
      
      await Share.share({
        message: shareContent,
        title: 'Günlük Paylaşımı'
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };
  
  // Düzenleme modunu açma işlevi
  const openEditMode = () => {
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditModalVisible(true);
  };
  
  // Düzenlemeyi kaydetme işlevi
  const saveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Hata", "Günlük başlığı boş olamaz.");
      return;
    }
    
    try {
      // Mevcut günlükleri al
      const userJournalKey = `${JOURNAL_STORAGE_KEY}_${user?.id || 'anonymous'}`;
      const savedEntries = await AsyncStorage.getItem(userJournalKey);
      const entries = savedEntries ? JSON.parse(savedEntries) : [];
      
      // Günlüğü güncelle
      const now = Date.now();
      const updatedEntries = entries.map(item => {
        if (item.id === entry.id) {
          return {
            ...item,
            title: editTitle,
            content: editContent,
            updatedAt: now
          };
        }
        return item;
      });
      
      // Kaydet
      await AsyncStorage.setItem(userJournalKey, JSON.stringify(updatedEntries));
      
      // Modalı kapat ve ana sayfaya dön
      setEditModalVisible(false);
      
      // Kullanıcıya bilgi ver
      Alert.alert("Başarılı", "Günlük kaydı güncellendi.", [
        { 
          text: "Tamam", 
          onPress: () => {
            // Günlük ekranına geri dön
            navigation.navigate('Journal', { refresh: true });
          }
        }
      ]);
    } catch (error) {
      console.error('Günlük güncellenirken hata:', error);
      Alert.alert("Hata", "Günlük güncellenirken bir sorun oluştu.");
    }
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
          <Ionicons name="chevron-back" size={24} color={categoryColor} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Günlük Detayı</Text>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color={categoryColor} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Kategori Etiketi */}
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryText}>{entry.category || 'Genel'}</Text>
        </View>
        
        {/* Başlık */}
        <Text style={styles.entryTitle}>{entry.title}</Text>
        
        {/* Tarih */}
        <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
        
        {/* Fotoğraf (eğer varsa) */}
        {entry.photo && (
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={() => setImageExpanded(!imageExpanded)}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: entry.photo }} 
              style={[
                styles.photo,
                imageExpanded && styles.expandedPhoto
              ]} 
              resizeMode={imageExpanded ? 'contain' : 'cover'}
            />
            {imageExpanded && (
              <TouchableOpacity 
                style={styles.closeImageButton}
                onPress={() => setImageExpanded(false)}
              >
                <Ionicons name="close-circle" size={28} color="white" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        
        {/* İçerik */}
        <Text style={styles.entryContent}>{entry.content}</Text>
        
        {/* Konum (eğer varsa) */}
        {entry.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={20} color={categoryColor} />
            <Text style={styles.locationText}>{entry.location.address}</Text>
          </View>
        )}
        
        {/* Boş alan */}
        <View style={styles.spacer} />
      </ScrollView>
      
      {/* Düzenleme butonu */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: categoryColor }]}
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
                
                <Text style={styles.modalTitle}>Günlük Kaydını Düzenle</Text>
                
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
                
                <TextInput
                  style={styles.contentInput}
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="İçerik..."
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
    backgroundColor: '#F7F8FA',
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
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  entryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  photoContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  expandedPhoto: {
    height: 400,
    borderRadius: 0,
  },
  closeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  entryContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    height: 80,
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
    color: '#9E2C21',
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
    minHeight: 200,
  },
}); 