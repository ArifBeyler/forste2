import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// Örnek bildirim verileri (gerçek uygulamada API'den veya depolamadan gelecektir)
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Su içme hatırlatıcısı',
    message: 'Su içme zamanı geldi! Sağlığınız için günde 2 litre su içmeyi unutmayın.',
    time: '10 dakika önce',
    type: 'reminder',
    isRead: false,
  },
  {
    id: '2',
    title: 'Proje güncellemesi',
    message: 'Mobil uygulama projeniz için yeni bir yorum eklendi.',
    time: '1 saat önce',
    type: 'project',
    isRead: false,
  },
  {
    id: '3',
    title: 'Yaklaşan etkinlik',
    message: 'Yarın saat 14:00\'da "Ekip Toplantısı" etkinliğiniz var.',
    time: '3 saat önce',
    type: 'event',
    isRead: true,
  },
  {
    id: '4',
    title: 'Görev tamamlandı',
    message: '"Tasarım dökümanlarını hazırla" görevi başarıyla tamamlandı.',
    time: '1 gün önce',
    type: 'task',
    isRead: true,
  },
  {
    id: '5',
    title: 'Yeni güncelleme',
    message: 'Uygulamaya yeni özellikler eklendi. Güncellemek için tıklayın.',
    time: '2 gün önce',
    type: 'system',
    isRead: true,
  },
];

// Bildirim türlerine göre ikonlar
const NOTIFICATION_ICONS = {
  reminder: { name: 'water-outline', color: '#3B82F6', bg: '#EBF5FF' },
  project: { name: 'folder-outline', color: '#10B981', bg: '#D1FAE5' },
  event: { name: 'calendar-outline', color: '#7E57C2', bg: '#F3E8FF' },
  task: { name: 'checkmark-circle-outline', color: '#EC4899', bg: '#FCE7F3' },
  system: { name: 'information-circle-outline', color: '#F59E0B', bg: '#FEF3C7' },
};

// Bildirim kartı bileşeni
const NotificationCard = ({ item, index, onPress }) => {
  const icon = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.system;
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()} 
      style={[
        styles.notificationCard, 
        item.isRead ? styles.notificationCardRead : styles.notificationCardUnread
      ]}
    >
      <TouchableOpacity 
        style={styles.notificationCardContent}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notificationTime}>{item.time}</Text>
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        
        {!item.isRead && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // Bildirimi okundu olarak işaretle
  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      const updatedNotifications = notifications.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      );
      setNotifications(updatedNotifications);
    }
    
    // Bildirimin türüne göre ilgili sayfaya yönlendirme yapabilirsiniz
    switch (notification.type) {
      case 'reminder':
        navigation.navigate('WaterTracker');
        break;
      case 'project':
        navigation.navigate('Projects');
        break;
      case 'event':
      case 'task':
        navigation.navigate('Calendar');
        break;
      default:
        // Sistem bildirimleri için bir eylem tanımlayabilirsiniz
        break;
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updatedNotifications);
  };

  // Bildirimleri temizle
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Okunmamış bildirim sayısı
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Bildirimler</Text>
        
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={markAllAsRead}
            >
              <Ionicons name="checkmark-done-outline" size={24} color="#7E57C2" />
            </TouchableOpacity>
          )}
          
          {notifications.length > 0 && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={clearAllNotifications}
            >
              <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <NotificationCard 
              item={item} 
              index={index} 
              onPress={handleNotificationPress} 
            />
          )}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="notifications-off-outline" 
            size={60} 
            color="#CCCCCC" 
          />
          <Text style={styles.emptyTitle}>Hiç bildiriminiz yok</Text>
          <Text style={styles.emptyMessage}>
            Yeni bir bildirim geldiğinde burada görüntülenecektir.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  notificationsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  notificationCardUnread: {
    borderLeftColor: '#7E57C2',
  },
  notificationCardRead: {
    borderLeftColor: 'transparent',
  },
  notificationCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7E57C2',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6C757D',
    lineHeight: 20,
  },
}); 