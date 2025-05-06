import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { eventApi, supabase, checkSupabaseConnection } from '../lib/supabase';
import { useAuth } from './AuthContext';

// AsyncStorage anahtarı
const EVENTS_STORAGE_KEY = 'calendar_events';
const TODOS_STORAGE_KEY = 'calendar_todos';

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
      refresh();
    } else if (user) {
      refresh();
    }
  }, [user]);

  // Seçilen gün değiştiğinde, o güne ait öğeleri göster
  // events bağımlılığını çıkarıyoruz
  useEffect(() => {
    if (selectedDay !== lastFetchedDay.current) {
      fetchByDay(selectedDay);
    }
  }, [selectedDay]);
  
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
    console.log("Veriler yenileniyor...");
    
    try {
      // Önce yerel verileri yükle (her zaman)
      const localEvents = await storage.getItems<CalendarItem>(EVENTS_STORAGE_KEY);
      const localTodos = await storage.getItems<CalendarItem>(TODOS_STORAGE_KEY);
      
      console.log(`Yerel veriler: ${localEvents.length} etkinlik, ${localTodos.length} görev bulundu`);
      
      // Yerel veriler varsa kullan
      const combinedLocal = [...localEvents, ...localTodos];
      if (combinedLocal.length > 0) {
        setEvents(combinedLocal);
      }
      
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
        }
      }
    } catch (error) {
      console.error('Takvim verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
      isRefreshing.current = false;
      
      // Verileri yükledikten sonra, seçili güne ait öğeleri filtrele
      // fetchByDay fonksiyonunu çağırmak yerine filtrele
      const filteredEvents = events.filter(item => item.day === selectedDay);
      setActiveEvents(filteredEvents);
      lastFetchedDay.current = selectedDay;
    }
  }, [isOnline, user, selectedDay]);

  // Belirli bir güne ait öğeleri getir
  const fetchByDay = useCallback(async (day: number) => {
    if (!day || day === lastFetchedDay.current) return;
    
    setLoading(true);
    console.log(`Gün ${day} için veriler getiriliyor...`);
    
    try {
      // Yerel filtreleme (her zaman yap)
      const filteredEvents = events.filter(item => item.day === day);
      setActiveEvents(filteredEvents);
      lastFetchedDay.current = day;
      
      console.log(`Yerel verilerden ${filteredEvents.length} öğe filtrelendi`);
      
      // Çevrimiçiyse Supabase'den de kontrol et
      // Ancak bu isteği sadece gerçekten ihtiyaç olduğunda yapalım
      if (isOnline && filteredEvents.length === 0) {
        console.log("Çevrimiçi olduğundan ve yerel veri bulunmadığından Supabase'den günlük veriler çekiliyor...");
        
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
          
          if (dayEvents.length > 0 || dayTodos.length > 0) {
            // Her iki kaynaktan da gelen verileri birleştir
            const combinedData = [...dayEvents, ...dayTodos];
            setActiveEvents(combinedData);
          }
        } catch (supabaseError) {
          console.error(`Gün ${day} için Supabase sorgusu hatası:`, supabaseError);
        }
      }
    } catch (error) {
      console.error('Günlük veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [events, isOnline, user]);

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
      console.log(`Öğe siliniyor, ID: ${id}`);
      
      // Silinen öğeyi bul
      const itemToDelete = events.find(item => item.id === id);
      if (!itemToDelete) {
        console.error(`Silinecek öğe bulunamadı, ID: ${id}`);
        return { success: false, error: 'Silinecek öğe bulunamadı' };
      }
      
      const isTask = itemToDelete.type === 'todo';
      console.log(`Öğe türü: ${isTask ? 'Görev' : 'Etkinlik'}`);
      
      // Yerel state'i güncelle - fonksiyonel güncelleme kullan
      setEvents(prev => prev.filter(item => item.id !== id));
      setActiveEvents(prev => prev.filter(item => item.id !== id));
      console.log("State güncellendi");
      
      // Yerel olarak sil
      const storageKey = isTask ? TODOS_STORAGE_KEY : EVENTS_STORAGE_KEY;
      const localItems = await storage.getItems<CalendarItem>(storageKey);
      const updatedItems = localItems.filter(item => item.id !== id);
      
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
        }
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Öğe silinirken hata:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' 
      };
    }
  }, [events, isOnline]);

  // Görev tamamlama durumunu değiştir
  const toggleTaskComplete = useCallback(async (id: string, isCompleted: boolean): Promise<{ success: boolean; error: string | null }> => {
    try {
      console.log(`Görev tamamlama durumu değiştiriliyor, ID: ${id}, Durum: ${isCompleted}`);
      
      // Görevi güncelle
      return await updateEvent(id, { completed: isCompleted });
    } catch (error) {
      console.error('Görev durumu değiştirilirken hata:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' 
      };
    }
  }, [updateEvent]);

  // Context değerleri
  const value: CalendarContextType = {
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
    toggleTaskComplete,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

// Context kullanım hook'u
export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}; 