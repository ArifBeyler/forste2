import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { eventApi, supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// AsyncStorage anahtarı
const EVENTS_STORAGE_KEY = 'calendar_events';
const TODOS_STORAGE_KEY = 'calendar_todos';

// Supabase bağlantı durumunu kontrol etmek için yardımcı fonksiyon
const checkSupabaseConnection = async () => {
  try {
    if (!supabase || typeof supabase.from !== 'function') {
      console.error('Supabase istemcisi düzgün yüklenemedi');
      return false;
    }
    
    // Basit bir sorgu ile bağlantıyı test et
    const result = await supabase.from('events').select('id').limit(1);
    
    if (result.error) {
      console.error('Supabase bağlantı testi başarısız:', result.error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase bağlantı kontrolü başarısız:', error);
    return false;
  }
};

// Event ve Task tipleri
interface BaseItem {
  id: string;
  title: string;
  description?: string;
  day: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  color: string;
  icon?: string;
  isAllDay?: boolean;
  reminderOption?: any;
  user_id?: string;
  created_at?: string;
}

interface Event extends BaseItem {
  type: 'meeting' | 'review' | 'sketch' | string;
  location?: string;
  participants?: string[];
}

interface Task extends BaseItem {
  type: 'todo';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

type CalendarItem = Event | Task;

interface CalendarContextType {
  events: CalendarItem[];
  activeEvents: CalendarItem[];
  selectedDay: number;
  isOnline: boolean;
  loading: boolean;
  
  // Actions
  setSelectedDay: (day: number) => void;
  refresh: () => Promise<void>;
  fetchByDay: (day: number) => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<{ success: boolean; error: string | null }>;
  addTask: (task: Omit<Task, 'id'>) => Promise<{ success: boolean; error: string | null }>;
  updateEvent: (id: string, data: Partial<CalendarItem>) => Promise<{ success: boolean; error: string | null }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; error: string | null }>;
  toggleTaskComplete: (id: string, isCompleted: boolean) => Promise<{ success: boolean; error: string | null }>;
}

// İstemci tarafında yerel depolama yardımcı fonksiyonları
const storage = {
  getItems: async <T>(key: string): Promise<T[]> => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`AsyncStorage okuma hatası (${key}):`, e);
      return [];
    }
  },
  
  saveItems: async <T>(key: string, items: T[]): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (e) {
      console.error(`AsyncStorage yazma hatası (${key}):`, e);
      return false;
    }
  }
};

// Context oluşturma
const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

/**
 * Versiyon 1.2.0 - Tamamen Manuel Yenileme Düzeltmesi
 * 
 * Yaşanan Sorun:
 * - Önceki düzeltmeye rağmen takvim ekranı hala düzenli olarak yenileniyordu
 * 
 * Çözüm Özetleri:
 * 1. Otomatik yenileme tamamen devre dışı bırakıldı:
 *    - Yalnızca kullanıcı yenile butonuna bastığında yenilenecek
 *    - Gün değişikliklerinde mevcut veriler kullanılacak
 *    - API çağrıları minimize edildi, sadece gerçekten ihtiyaç olduğunda yapılıyor
 * 
 * 2. Güncel düzenlemeler:
 *    - lastApiCallTime kullanılarak gereksiz API çağrıları önleniyor
 *    - Events state'i değişiminde döngüsel yenileme önlendi
 *    - Yenileme butonu için animasyon eklendi - kullanıcı geri bildirimi için
 * 
 * 3. Hafıza kullanımı optimizasyonu:
 *    - Sadece gösterilen güne ait veriler aktif olarak tutulacak
 *    - Tüm veriler arka planda önbelleğe alınacak
 */

// CalendarProvider props tipi
interface CalendarProviderProps {
  children: React.ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [activeEvents, setActiveEvents] = useState<CalendarItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [loading, setLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  
  // Referanslar
  const isInitialMount = useRef(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshing = useRef(false);
  const lastFetchedDay = useRef<number | null>(null);
  const lastApiCallTime = useRef<number | null>(null);
  
  // Çevrimiçi durumunu kontrol et - yalnızca bir kez
  useEffect(() => {
    const checkOnlineStatus = async () => {
      try {
        const status = await checkSupabaseConnection();
        setIsOnline(status);
        console.log("Bağlantı durumu:", status ? "Çevrimiçi" : "Çevrimdışı");
      } catch (error) {
        console.error("Bağlantı kontrolü hatası:", error);
        setIsOnline(false);
      }
    };
    
    checkOnlineStatus();
    
    // Periyodik kontrol (5 dakikada bir yapılıyor)
    const interval = setInterval(checkOnlineStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Kullanıcı değiştiğinde veri yükle - sadece kullanıcı bağımlılığı
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // İlk açılışta bir kez veri yükle
      refresh();
    }
    // Kullanıcı değişikliğinde otomatik yenileme yapılmayacak
  }, [user]); // refresh bağımlılığını kaldırdık

  // Seçilen gün değiştiğinde, o güne ait öğeleri göster
  useEffect(() => {
    // Sadece kullanıcı bir gün seçtiğinde ilgili günün verilerini filtrele
    // Otomatik refresh yapmayacağız
    if (selectedDay !== lastFetchedDay.current) {
      // Eğer events içinde veri varsa, önce yerel filtreleme yap
      if (events.length > 0) {
        console.log(`Gün ${selectedDay} için yerel veriler filtreleniyor...`);
        const filteredEvents = events.filter(item => item.day === selectedDay);
        setActiveEvents(filteredEvents);
        lastFetchedDay.current = selectedDay;
      } else {
        // Events boşsa tekrar veri çekmek için fetchByDay çağrılıyor
        console.log(`Gün ${selectedDay} için veri bulunamadı, yükleniyor...`);
        fetchByDay(selectedDay);
      }
    }
  }, [selectedDay, events.length]); // Sadece gün veya veri sayısı değiştiğinde
  
  // Tüm etkinlik ve görevleri yeniden yükle
  const refresh = useCallback(async () => {
    // Eğer yükleme işlemi zaten devam ediyorsa yeni bir istek başlatma
    if (isRefreshing.current || loading) {
      console.log("Zaten yükleme yapılıyor, yeni istek atlanıyor");
      return;
    }
    
    // Önceki zamanlayıcıyı temizle
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    isRefreshing.current = true;
    setLoading(true);
    console.log("Veriler yenileniyor... (Manuel Yenileme)");
    
    try {
      // Önce yerel verileri yükle (her zaman)
      const localEvents = await storage.getItems<CalendarItem>(EVENTS_STORAGE_KEY);
      const localTodos = await storage.getItems<CalendarItem>(TODOS_STORAGE_KEY);
      
      console.log(`Yerel veriler: ${localEvents.length} etkinlik, ${localTodos.length} görev bulundu`);
      
      // Yerel veriler varsa kullan
      const combinedLocal = [...localEvents, ...localTodos];
      
      // Verileri state'e yükle
      if (combinedLocal.length > 0) {
        setEvents(combinedLocal);
      }
      
      // Tüm veri kaynakları (yerel veri ve olası Supabase verileri için kombinasyonu tutacak bir değişken)
      let allData = combinedLocal;
      
      // Eğer çevrimiçiyse Supabase'den veri çek
      if (isOnline) {
        console.log("Çevrimiçi olduğundan Supabase verileri çekiliyor...");
        
        try {
          // Kullanıcı ID'si
          const userId = user?.id || null;
          
          // eventApi.events kontrolü
          if (!eventApi || !eventApi.events || !eventApi.todos) {
            throw new Error("Supabase API bağlantısı hazır değil");
          }
          
          // Etkinlikleri ve görevleri paralel olarak getir
          const [eventResult, todoResult] = await Promise.all([
            eventApi.events.getAll(userId),
            eventApi.todos.getAll(userId)
          ]);
          
          const eventData = eventResult.data || [];
          const todoData = todoResult.data || [];
          
          console.log(`Supabase'den ${eventData.length} etkinlik, ${todoData.length} görev alındı`);
          
          // Son API çağrısı zamanını güncelle
          lastApiCallTime.current = Date.now();
          
          // Veri varsa güncelle
          const hasEvents = eventData.length > 0;
          const hasTodos = todoData.length > 0;
          
          if (hasEvents || hasTodos) {
            const combinedData = [
              ...(hasEvents ? eventData : []),
              ...(hasTodos ? todoData : [])
            ];
            
            console.log(`Toplam ${combinedData.length} öğe state'e yükleniyor`);
            setEvents(combinedData);
            
            // Güncel verileri allData'ya atayalım ki aşağıda kullanabilelim
            allData = combinedData;
            
            // Yerel depolamayı da güncelle
            if (hasEvents) {
              await storage.saveItems(EVENTS_STORAGE_KEY, eventData);
            }
            
            if (hasTodos) {
              await storage.saveItems(TODOS_STORAGE_KEY, todoData);
            }
          }
        } catch (supabaseError) {
          console.error('Supabase verisi alınırken hata:', supabaseError);
          // Hata durumunda yerel veri ile devam ederiz
        }
      }
      
      // Verileri yükledikten sonra, seçili güne ait öğeleri filtrele
      const filteredEvents = allData.filter(item => item.day === selectedDay);
      setActiveEvents(filteredEvents);
      lastFetchedDay.current = selectedDay;
      console.log(`Güncellenmiş verilerden ${filteredEvents.length} öğe filtrelendi`);
      
    } catch (error) {
      console.error('Takvim verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  }, [isOnline, user, selectedDay]); // Asla burada events bağımlılığını eklemeyin!

  // Belirli bir güne ait öğeleri getir
  const fetchByDay = useCallback(async (day: number) => {
    if (!day || day === lastFetchedDay.current) return;
    
    setLoading(true);
    console.log(`Gün ${day} için veriler getiriliyor...`);
    
    try {
      // Önce yerel depolamadan verileri çek (events state'ine bağımlılığı kaldırmak için)
      const localEvents = await storage.getItems<CalendarItem>(EVENTS_STORAGE_KEY);
      const localTodos = await storage.getItems<CalendarItem>(TODOS_STORAGE_KEY);
      const combinedLocal = [...localEvents, ...localTodos];
      
      // Yerel filtreleme
      const filteredEvents = combinedLocal.filter(item => item.day === day);
      setActiveEvents(filteredEvents);
      lastFetchedDay.current = day;
      
      console.log(`Yerel verilerden ${filteredEvents.length} öğe filtrelendi`);
      
      // API çağrısı SADECE aşağıdaki koşullarda yapılacak:
      // 1. Çevrimiçi olunduğunda
      // 2. Yerel veride hiç öğe bulunamadığında
      // 3. Son API çağrısının üzerinden belirli bir süre geçtiğinde (örn: 30 dakika)
      const shouldFetchFromAPI = isOnline && 
                                (filteredEvents.length === 0 || 
                                 !lastApiCallTime.current || 
                                 (Date.now() - lastApiCallTime.current > 30 * 60 * 1000));
      
      if (shouldFetchFromAPI) {
        console.log("Supabase'den günlük veriler çekiliyor...");
        
        try {
          // Kullanıcı ID'si
          const userId = user?.id || null;
          
          // eventApi kontrolü
          if (!eventApi || !eventApi.events || !eventApi.todos) {
            throw new Error("Supabase API bağlantısı hazır değil");
          }
          
          // Etkinlik ve görev sorgularını oluştur
          const [eventResult, todoResult] = await Promise.all([
            eventApi.events.getByDay(day, userId),
            eventApi.todos.getByDay(day, userId)
          ]);
          
          const dayEvents = eventResult.data || [];
          const dayTodos = todoResult.data || [];
          
          console.log(`Supabase'den gün ${day} için ${dayEvents.length} etkinlik ve ${dayTodos.length} görev alındı`);
          
          // API çağrısı zamanını güncelle
          lastApiCallTime.current = Date.now();
          
          if (dayEvents.length > 0 || dayTodos.length > 0) {
            // Her iki kaynaktan da gelen verileri birleştir
            const combinedData = [...dayEvents, ...dayTodos];
            setActiveEvents(combinedData);
          }
        } catch (supabaseError) {
          console.error(`Gün ${day} için Supabase sorgusu hatası:`, supabaseError);
        }
      } else {
        console.log("API çağrısı atlanıyor, mevcut veriler kullanılıyor");
      }
    } catch (error) {
      console.error('Günlük veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [isOnline, user]);

  // Yeni etkinlik ekle
  const addEvent = useCallback(async (eventData: Omit<Event, 'id'>): Promise<{ success: boolean; error: string | null }> => {
    try {
      console.log("Yeni etkinlik ekleniyor:", eventData.title);
      
      // Kullanıcı bilgisini ekle
      const completeEvent = {
        ...eventData,
        user_id: user?.id || null,
        created_at: new Date().toISOString()
      };
      
      let newEvent: Event;
      
      // Çevrimiçiyse, Supabase'e kaydet
      if (isOnline) {
        console.log("Çevrimiçi olduğundan etkinlik Supabase'e kaydediliyor...");
        
        try {
          // eventApi kontrolü
          if (!eventApi || !eventApi.events) {
            throw new Error("Supabase API bağlantısı hazır değil");
          }
          
          const { data, error } = await eventApi.events.add(completeEvent);
          
          if (error) {
            console.error('Supabase etkinlik ekleme hatası:', error);
            // Hata durumunda yerel olarak ekleyelim
            newEvent = {
              ...completeEvent,
              id: `local_${Date.now()}`
            } as Event;
          } else if (data) {
            console.log("Etkinlik Supabase'e başarıyla kaydedildi, ID:", data.id);
            newEvent = data as Event;
          } else {
            // Veri dönmezse yerel olarak ekle
            newEvent = {
              ...completeEvent,
              id: `local_${Date.now()}`
            } as Event;
          }
        } catch (supabaseError) {
          console.error('Supabase etkinlik ekleme hatası:', supabaseError);
          // Hata durumunda yerel olarak ekleyelim
          newEvent = {
            ...completeEvent,
            id: `local_${Date.now()}`
          } as Event;
        }
      } else {
        // Çevrimdışıysa, yerel olarak ekle
        console.log("Çevrimdışı olduğundan etkinlik yerel olarak kaydediliyor...");
        newEvent = {
          ...completeEvent,
          id: `local_${Date.now()}`
        } as Event;
      }
      
      // State'i güncellerken useCallback'in yakalamayacağı şekilde fonksiyonel güncellemeler kullan
      setEvents(prev => [...prev, newEvent]);
      console.log("Etkinlik state'e eklendi");
      
      // Eğer eklenen etkinlik seçili güne aitse, activeEvents'i güncelle
      if (newEvent.day === selectedDay) {
        setActiveEvents(prev => [...prev, newEvent]);
      }
      
      // Yerel depolamaya ekle
      const localEvents = await storage.getItems<Event>(EVENTS_STORAGE_KEY);
      await storage.saveItems(EVENTS_STORAGE_KEY, [...localEvents, newEvent]);
      console.log("Etkinlik yerel depolamaya kaydedildi");
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Etkinlik eklenirken hata:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' 
      };
    }
  }, [isOnline, user, selectedDay]);

  // Yeni görev ekle
  const addTask = useCallback(async (taskData: Omit<Task, 'id'>): Promise<{ success: boolean; error: string | null }> => {
    try {
      console.log("Yeni görev ekleniyor:", taskData.title);
      
      // Kullanıcı bilgisini ekle
      const completeTask = {
        ...taskData,
        user_id: user?.id || null,
        created_at: new Date().toISOString()
      };
      
      let newTask: Task;
      
      // Çevrimiçiyse, Supabase'e kaydet
      if (isOnline) {
        console.log("Çevrimiçi olduğundan görev Supabase'e kaydediliyor...");
        
        try {
          // eventApi kontrolü
          if (!eventApi || !eventApi.todos) {
            throw new Error("Supabase API bağlantısı hazır değil");
          }
          
          const { data, error } = await eventApi.todos.add(completeTask);
          
          if (error) {
            console.error('Supabase görev ekleme hatası:', error);
            // Hata durumunda yerel olarak ekleyelim
            newTask = {
              ...completeTask,
              id: `local_${Date.now()}`
            } as Task;
          } else if (data) {
            console.log("Görev Supabase'e başarıyla kaydedildi, ID:", data.id);
            newTask = data as Task;
          } else {
            // Veri dönmezse yerel olarak ekle
            newTask = {
              ...completeTask,
              id: `local_${Date.now()}`
            } as Task;
          }
        } catch (supabaseError) {
          console.error('Supabase görev ekleme hatası:', supabaseError);
          // Hata durumunda yerel olarak ekleyelim
          newTask = {
            ...completeTask,
            id: `local_${Date.now()}`
          } as Task;
        }
      } else {
        // Çevrimdışıysa, yerel olarak ekle
        console.log("Çevrimdışı olduğundan görev yerel olarak kaydediliyor...");
        newTask = {
          ...completeTask,
          id: `local_${Date.now()}`
        } as Task;
      }
      
      // Yerel state'i güncelle - fonksiyonel güncelleme kullanarak
      setEvents(prev => [...prev, newTask]);
      console.log("Görev state'e eklendi");
      
      // Eğer eklenen görev seçili güne aitse, activeEvents'i güncelle
      if (newTask.day === selectedDay) {
        setActiveEvents(prev => [...prev, newTask]);
      }
      
      // Yerel depolamaya ekle
      const localTodos = await storage.getItems<Task>(TODOS_STORAGE_KEY);
      await storage.saveItems(TODOS_STORAGE_KEY, [...localTodos, newTask]);
      console.log("Görev yerel depolamaya kaydedildi");
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Görev eklenirken hata:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' 
      };
    }
  }, [isOnline, user, selectedDay]);

  // Etkinlik/görev güncelle
  const updateEvent = useCallback(async (id: string, data: Partial<CalendarItem>): Promise<{ success: boolean; error: string | null }> => {
    try {
      console.log(`Öğe (ID: ${id}) güncelleniyor`, data);
      
      // Yerel state'i güncelle (optimistik) - fonksiyonel güncelleme kullan
      setEvents(prevEvents => 
        prevEvents.map(item => item.id === id ? { ...item, ...data } : item)
      );
      
      console.log("State güncellendi");
      
      // Aktif etkinlikleri de güncelle
      setActiveEvents(prev => 
        prev.map(item => item.id === id ? { ...item, ...data } : item)
      );
      
      // Öğe tipini bul
      const currentEvent = events.find(item => item.id === id);
      if (!currentEvent) {
        return { success: false, error: 'Güncellenecek öğe bulunamadı' };
      }
      
      // Yerel olarak güncelle
      const isTask = currentEvent.type === 'todo';
      const storageKey = isTask ? TODOS_STORAGE_KEY : EVENTS_STORAGE_KEY;
      
      // İlgili öğeleri al ve güncelle
      const localItems = await storage.getItems<CalendarItem>(storageKey);
      const updatedItems = localItems.map(item => 
        item.id === id ? { ...item, ...data } : item
      );
      
      await storage.saveItems(storageKey, updatedItems);
      console.log("Yerel depolama güncellendi");
      
      // Çevrimiçiyse ve yerel önbelleklenmiş bir öğe değilse, Supabase'de de güncelle
      if (isOnline && !id.startsWith('local_')) {
        console.log("Çevrimiçi olduğundan Supabase'de de güncelleniyor...");
        
        try {
          // eventApi kontrolü
          if (!eventApi || !(isTask ? eventApi.todos : eventApi.events)) {
            throw new Error("Supabase API bağlantısı hazır değil");
          }
          
          let result;
          
          if (isTask) {
            result = await eventApi.todos.update(id, data);
          } else {
            result = await eventApi.events.update(id, data);
          }
          
          if (result.error) {
            console.error('Supabase güncelleme hatası:', result.error);
          } else {
            console.log("Supabase güncellemesi başarılı");
          }
        } catch (supabaseError) {
          console.error('Supabase güncellemesi sırasında hata:', supabaseError);
        }
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Öğe güncellenirken hata:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' 
      };
    }
  }, [events, isOnline]);

  // Etkinlik/görev sil
  const deleteEvent = useCallback(async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      console.log(`Öğe silme işlemi başlatılıyor, ID: ${id}`);
      
      if (!id) {
        console.error('Silinecek öğe ID\'si belirtilmemiş');
        return { success: false, error: 'Geçersiz ID: Silinecek öğe ID\'si belirtilmemiş' };
      }
      
      // Silinen öğeyi bul
      const itemToDelete = events.find(item => item.id === id);
      if (!itemToDelete) {
        console.error(`Silinecek öğe bulunamadı, ID: ${id}`);
        console.log('Mevcut etkinlikler:', JSON.stringify(events.map(e => ({ id: e.id, title: e.title })), null, 2));
        return { success: false, error: 'Silinecek öğe bulunamadı' };
      }
      
      const isTask = itemToDelete.type === 'todo';
      console.log(`Silinecek öğe türü: ${isTask ? 'Görev' : 'Etkinlik'}, Başlık: ${itemToDelete.title}`);
      
      // Yerel state'i güncelle - fonksiyonel güncelleme kullan
      setEvents(prev => {
        const filtered = prev.filter(item => item.id !== id);
        console.log(`Önceki etkinlik sayısı: ${prev.length}, Yeni etkinlik sayısı: ${filtered.length}`);
        return filtered;
      });
      
      setActiveEvents(prev => {
        const filtered = prev.filter(item => item.id !== id);
        console.log(`Önceki aktif etkinlik sayısı: ${prev.length}, Yeni aktif etkinlik sayısı: ${filtered.length}`);
        return filtered;
      });
      
      console.log("Uygulama state güncellemesi tamamlandı");
      
      // Yerel olarak sil
      const storageKey = isTask ? TODOS_STORAGE_KEY : EVENTS_STORAGE_KEY;
      const localItems = await storage.getItems<CalendarItem>(storageKey);
      
      console.log(`Yerel depolama silme öncesi ${storageKey} öğe sayısı: ${localItems.length}`);
      const updatedItems = localItems.filter(item => item.id !== id);
      console.log(`Yerel depolama silme sonrası ${storageKey} öğe sayısı: ${updatedItems.length}`);
      
      await storage.saveItems(storageKey, updatedItems);
      console.log("Yerel depolama güncellendi");
      
      // Çevrimiçiyse ve yerel önbelleklenmiş bir öğe değilse, Supabase'den de sil
      if (isOnline && !id.startsWith('local_')) {
        console.log("Çevrimiçi olduğundan Supabase'den de siliniyor...");
        
        try {
          // eventApi kontrolü
          if (!eventApi || !(isTask ? eventApi.todos : eventApi.events)) {
            throw new Error("Supabase API bağlantısı hazır değil");
          }
          
          let result;
          
          if (isTask) {
            result = await eventApi.todos.delete(id);
          } else {
            result = await eventApi.events.delete(id);
          }
          
          if (result.error) {
            console.error('Supabase silme hatası:', result.error);
          } else {
            console.log("Supabase'den silme başarılı");
          }
        } catch (supabaseError) {
          console.error('Supabase silme işlemi sırasında hata:', supabaseError);
          // Hata olsa bile yerel silme başarılı olduğundan kullanıcı açısından işlem başarılı
        }
      }
      
      console.log(`Öğe (ID: ${id}) başarıyla silindi`);
      return { success: true, error: null };
    } catch (error) {
      console.error('Öğe silinirken hata:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' 
      };
    }
  }, [events, isOnline]);

  // Toggle task complete
  const toggleTaskComplete = useCallback(async (id: string, isCompleted: boolean): Promise<{ success: boolean; error: string | null }> => {
    try {
      console.log(`Görev tamamlama işlemi başlatılıyor, ID: ${id}, Tamamlanma Durumu: ${isCompleted}`);
      
      if (!id) {
        console.error('Tamamlanacak görev ID\'si belirtilmemiş');
        return { success: false, error: 'Geçersiz ID: Tamamlanacak görev ID\'si belirtilmemiş' };
      }
      
      // Görev bul
      const taskToUpdate = events.find(item => item.id === id && item.type === 'todo');
      if (!taskToUpdate) {
        console.error(`Tamamlanacak görev bulunamadı, ID: ${id}`);
        console.log('Mevcut görevler:', JSON.stringify(events.filter(e => e.type === 'todo').map(e => ({ id: e.id, title: e.title })), null, 2));
        return { success: false, error: 'Tamamlanacak görev bulunamadı' };
      }
      
      // Görev güncelle
      const updatedTask = {
        ...taskToUpdate,
        completed: isCompleted
      };
      
      // Yerel state'i güncelle
      setEvents(prev => {
        const filtered = prev.filter(item => item.id !== id);
        const updated = [...filtered, updatedTask];
        console.log(`Önceki görev sayısı: ${prev.length}, Yeni görev sayısı: ${updated.length}`);
        return updated;
      });
      
      setActiveEvents(prev => {
        const filtered = prev.filter(item => item.id !== id);
        const updated = [...filtered, updatedTask];
        console.log(`Önceki aktif görev sayısı: ${prev.length}, Yeni aktif görev sayısı: ${updated.length}`);
        return updated;
      });
      
      console.log("Uygulama state güncellemesi tamamlandı");
      
      // Yerel olarak güncelle
      const localTodos = await storage.getItems<Task>(TODOS_STORAGE_KEY);
      const updatedTodos = localTodos.map(item => 
        item.id === id ? updatedTask : item
      );
      
      await storage.saveItems(TODOS_STORAGE_KEY, updatedTodos);
      console.log("Yerel depolama güncellendi");
      
      // Çevrimiçiyse ve yerel önbelleklenmiş bir öğe değilse, Supabase'de de güncelle
      if (isOnline && !id.startsWith('local_')) {
        console.log("Çevrimiçi olduğundan Supabase'de de güncelleniyor...");
        
        try {
          // eventApi kontrolü
          if (!eventApi || !eventApi.todos) {
            throw new Error("Supabase API bağlantısı hazır değil");
          }
          
          const result = await eventApi.todos.update(id, { completed: isCompleted });
          
          if (result.error) {
            console.error('Supabase güncelleme hatası:', result.error);
          } else {
            console.log("Supabase güncellemesi başarılı");
          }
        } catch (supabaseError) {
          console.error('Supabase güncellemesi sırasında hata:', supabaseError);
        }
      }
      
      console.log(`Görev (ID: ${id}) başarıyla güncellendi`);
      return { success: true, error: null };
    } catch (error) {
      console.error('Görev güncellenirken hata:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' 
      };
    }
  }, [events, isOnline]);

  return (
    <CalendarContext.Provider
      value={{
        events,
        activeEvents,
        selectedDay,
        isOnline,
        loading,
        setSelectedDay,
        refresh,
        fetchByDay,
        addEvent,
        addTask,
        updateEvent,
        deleteEvent,
        toggleTaskComplete
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};