import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalendar } from '../context/CalendarContext';

// CalendarStatistics bileşeni
const CalendarStatistics = ({ navigation }) => {
  const { activeEvents, loading: contextLoading } = useCalendar();
  const [statistics, setStatistics] = useState({
    totalEvents: 0,
    completedEvents: 0,
    completionRate: 0,
    weeklyCompletionRate: 0,
    mostActiveDay: '',
    mostProductiveHour: '',
    categoryDistribution: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStatistics();
  }, [activeEvents]);

  const calculateStatistics = () => {
    try {
      if (!activeEvents) {
        setStatistics({
          totalEvents: 0,
          completedEvents: 0,
          completionRate: 0,
          weeklyCompletionRate: 0,
          mostActiveDay: 'Veri yok',
          mostProductiveHour: 'Veri yok',
          categoryDistribution: []
        });
        setLoading(false);
        return;
      }
      
      const events = activeEvents || [];
      
      // 1. Genel Tamamlanma Oranları
      const completedEvents = events.filter(event => event.completed);
      const totalEvents = events.length;
      const completionRate = totalEvents > 0 ? (completedEvents.length / totalEvents) * 100 : 0;
      
      // Basit istatistikler oluştur
      setStatistics({
        totalEvents,
        completedEvents: completedEvents.length,
        completionRate,
        weeklyCompletionRate: completionRate, // basitleştirme
        mostActiveDay: 'Pazartesi', // geçici sabit değer
        mostProductiveHour: '09:00 - 10:00', // geçici sabit değer
        categoryDistribution: [
          { name: 'Kişisel Gelişim', count: Math.floor(totalEvents * 0.3), percentage: 30, color: '#FF6384' },
          { name: 'Spor', count: Math.floor(totalEvents * 0.15), percentage: 15, color: '#36A2EB' },
          { name: 'İş / Üretkenlik', count: Math.floor(totalEvents * 0.4), percentage: 40, color: '#FFCE56' },
          { name: 'İlişkisel', count: Math.floor(totalEvents * 0.15), percentage: 15, color: '#4BC0C0' }
        ]
      });
      
    } catch (error) {
      console.error("İstatistik hesaplama hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (value) => {
    return `%${value.toFixed(0)}`;
  };

  if (loading || contextLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>İstatistikler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Takvim İstatistikleri</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 1. Genel Tamamlanma Oranları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Genel Tamamlanma Oranları</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.totalEvents}</Text>
              <Text style={styles.statLabel}>Toplam Etkinlik</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.completedEvents}</Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatPercent(statistics.completionRate)}</Text>
              <Text style={styles.statLabel}>Başarı Oranı</Text>
            </View>
          </View>
          
          <View style={styles.weeklyRate}>
            <Text style={styles.weeklyRateTitle}>Bu Haftaki Başarı Oranı:</Text>
            <Text style={styles.weeklyRateValue}>{formatPercent(statistics.weeklyCompletionRate)}</Text>
          </View>
          
          {/* Basit bar chart */}
          <View style={styles.simpleBarChart}>
            <View style={styles.simpleBarContainer}>
              <Text style={styles.simpleBarLabel}>Toplam</Text>
              <View style={[styles.simpleBar, {width: '100%'}]} />
              <Text style={styles.simpleBarValue}>{statistics.totalEvents}</Text>
            </View>
            <View style={styles.simpleBarContainer}>
              <Text style={styles.simpleBarLabel}>Tamamlanan</Text>
              <View 
                style={[
                  styles.simpleBar, 
                  {
                    width: `${statistics.totalEvents > 0 ? (statistics.completedEvents / statistics.totalEvents) * 100 : 0}%`,
                    backgroundColor: '#4BC0C0'
                  }
                ]} 
              />
              <Text style={styles.simpleBarValue}>{statistics.completedEvents}</Text>
            </View>
          </View>
        </View>
        
        {/* 2. Zaman Bazlı İstatistikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Zaman Bazlı İstatistikler</Text>
          
          <View style={styles.timeStats}>
            <View style={styles.timeStat}>
              <Text style={styles.timeStatLabel}>En Aktif Gün:</Text>
              <Text style={styles.timeStatValue}>{statistics.mostActiveDay}</Text>
            </View>
            
            <View style={styles.timeStat}>
              <Text style={styles.timeStatLabel}>En Verimli Saat Aralığı:</Text>
              <Text style={styles.timeStatValue}>{statistics.mostProductiveHour}</Text>
            </View>
          </View>
        </View>
        
        {/* 3. Görev Türü Dağılımı */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Görev Türü Dağılımı</Text>
          
          {statistics.categoryDistribution.length > 0 ? (
            <View style={styles.simplePieChart}>
              {statistics.categoryDistribution.map((category, index) => (
                <View key={index} style={styles.simplePieItem}>
                  <View style={styles.simplePieRow}>
                    <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.simplePieValue}>{category.count} etkinlik</Text>
                  </View>
                  <View style={styles.simplePieBarContainer}>
                    <View 
                      style={[
                        styles.simplePieBar, 
                        { 
                          width: `${category.percentage}%`,
                          backgroundColor: category.color 
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>Henüz kategori verisi bulunmuyor.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#3B82F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFFD',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  weeklyRate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#E6EFFD',
    borderRadius: 8,
    marginBottom: 16,
  },
  weeklyRateTitle: {
    fontSize: 14,
    color: '#333',
  },
  weeklyRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  simpleBarChart: {
    marginVertical: 16,
    paddingHorizontal: 10,
  },
  simpleBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  simpleBarLabel: {
    width: 80,
    fontSize: 12,
    color: '#666',
  },
  simpleBar: {
    height: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 10,
  },
  simpleBarValue: {
    width: 40,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'right',
  },
  timeStats: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  timeStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  timeStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  simplePieChart: {
    marginVertical: 16,
  },
  simplePieItem: {
    marginBottom: 16,
  },
  simplePieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  simplePieValue: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#666',
  },
  simplePieBarContainer: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  simplePieBar: {
    height: '100%',
    borderRadius: 6,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  }
});

export default CalendarStatistics; 