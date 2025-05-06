import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fddpxhoregphgcayvdkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZHB4aG9yZWdwaGdjYXl2ZGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODU5NzMsImV4cCI6MjA2MTg2MTk3M30.W_v0hR2k7csvkqOs_vg_J_GZKFvb7ZzHiWsnIS3Zsxs';

// Singleton instance - bir kere oluştur
let supabaseInstance = null;

// Supabase istemcisini oluştur
const createSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: { 'X-Client-Info': 'react-native' },
      },
      // Bağlantı hatası yönetimi için zaman aşımları
      realtime: {
        timeout: 30000, // 30 saniye
      },
    });
    
    console.log("Supabase istemcisi başarıyla oluşturuldu");
    return supabaseInstance;
  } catch (error) {
    console.error('Supabase istemcisi oluşturulurken hata:', error);
    // Hata durumunda temel işlevlere sahip bir istemci nesnesi oluştur
    const mockClient = {
      from: (table) => {
        console.warn(`Supabase bağlantısı olmadığından ${table} tablosuna erişilemiyor.`);
        return {
          select: () => ({
            eq: () => ({
              order: () => ({ data: [], error: null }),
              data: [],
              error: null
            }),
            data: [],
            error: null
          }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
        };
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signUp: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: null, unsubscribe: () => {} }),
      }
    };
    
    supabaseInstance = mockClient;
    return mockClient;
  }
};

// İstemciyi oluştur ve dışa aktar
export const supabase = createSupabaseClient();

// Bağlantı durumunu takip için
let lastConnectionCheck = 0;
let isConnected = false;

/**
 * Supabase durumunu kontrol et 
 * @returns {Promise<boolean>} Supabase istemcisinin başarıyla oluşturulup oluşturulmadığı
 */
export const checkSupabaseConnection = async () => {
  try {
    // Son kontrol üzerinden 5 saniyeden az süre geçtiyse, son durumu döndür
    const now = Date.now();
    if (now - lastConnectionCheck < 5000) {
      return isConnected;
    }
    
    // Basit bir sorgu ile bağlantıyı test et
    const { data, error } = await supabase.from('events').select('id').limit(1);
    lastConnectionCheck = now;
    
    if (error) {
      console.error('Supabase bağlantı testi başarısız:', error.message);
      isConnected = false;
      return false;
    }
    
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Supabase bağlantı kontrolü başarısız:', error);
    isConnected = false;
    return false;
  }
};

// Veritabanı sorgu işlemleri için yardımcı fonksiyonlar
const dbHelper = {
  /**
   * Güvenli sorgu çalıştırmak için yardımcı fonksiyon
   * @param {Function} queryFn - Çalıştırılacak sorgu işlevi
   * @returns {Promise<{ data: any, error: Error }>} - Sonuç
   */
  safeQuery: async (queryFn) => {
    try {
      return await queryFn();
    } catch (error) {
      console.error('Supabase sorgusu başarısız:', error);
      return { data: null, error };
    }
  }
};

/**
 * Etkinlik ve görevler için API işlevleri
 */
export const eventApi = {
  // Etkinlikler
  events: {
    /**
     * Tüm etkinlikleri getir
     */
    getAll: async (userId = null) => {
      return dbHelper.safeQuery(async () => {
        let query = supabase.from('events').select('*');
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return { data: data || [], error: null };
      });
    },
    
    /**
     * Belirli bir güne ait etkinlikleri getir
     */
    getByDay: async (day, userId = null) => {
      return dbHelper.safeQuery(async () => {
        let query = supabase.from('events').select('*');
        
        query = query.eq('day', day);
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query.order('start_time', { ascending: true });
        
        if (error) throw error;
        return { data: data || [], error: null };
      });
    },
    
    /**
     * Yeni etkinlik ekle
     */
    add: async (eventData) => {
      return dbHelper.safeQuery(async () => {
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();
        
        if (error) throw error;
        return { data, error: null };
      });
    },
    
    /**
     * Etkinlik güncelle
     */
    update: async (id, eventData) => {
      return dbHelper.safeQuery(async () => {
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return { data, error: null };
      });
    },
    
    /**
     * Etkinlik sil
     */
    delete: async (id) => {
      return dbHelper.safeQuery(async () => {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        return { error: null };
      });
    }
  },
  
  // Görevler (Todos)
  todos: {
    /**
     * Tüm görevleri getir
     */
    getAll: async (userId = null) => {
      return dbHelper.safeQuery(async () => {
        let query = supabase.from('todos').select('*');
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return { data: data || [], error: null };
      });
    },
    
    /**
     * Belirli bir güne ait görevleri getir
     */
    getByDay: async (day, userId = null) => {
      return dbHelper.safeQuery(async () => {
        let query = supabase.from('todos').select('*');
        
        query = query.eq('day', day);
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query.order('start_time', { ascending: true });
        
        if (error) throw error;
        return { data: data || [], error: null };
      });
    },
    
    /**
     * Yeni görev ekle
     */
    add: async (todoData) => {
      return dbHelper.safeQuery(async () => {
        const { data, error } = await supabase
          .from('todos')
          .insert(todoData)
          .select()
          .single();
        
        if (error) throw error;
        return { data, error: null };
      });
    },
    
    /**
     * Görevi güncelle
     */
    update: async (id, todoData) => {
      return dbHelper.safeQuery(async () => {
        const { data, error } = await supabase
          .from('todos')
          .update(todoData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return { data, error: null };
      });
    },
    
    /**
     * Görevi tamamlandı olarak işaretle
     */
    toggleComplete: async (id, isCompleted) => {
      return dbHelper.safeQuery(async () => {
        const { data, error } = await supabase
          .from('todos')
          .update({ completed: isCompleted })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return { data, error: null };
      });
    },
    
    /**
     * Görevi sil
     */
    delete: async (id) => {
      return dbHelper.safeQuery(async () => {
        const { error } = await supabase
          .from('todos')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        return { error: null };
      });
    }
  }
};

/**
 * Oturum değişikliklerini dinlemek için
 */
export const subscribeToAuthChanges = (callback) => {
  try {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  } catch (error) {
    console.error('Auth değişikliği dinlenirken hata:', error);
    return { unsubscribe: () => {} };
  }
};

/**
 * Kullanıcı API işlevleri
 */
export const userApi = {
  /**
   * E-posta ve şifre ile giriş yap
   */
  signIn: async (email, password) => {
    return dbHelper.safeQuery(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    });
  },
  
  /**
   * Yeni kullanıcı kaydı
   */
  signUp: async (email, password, userData = {}) => {
    return dbHelper.safeQuery(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      
      if (error) throw error;
      return { data, error: null };
    });
  },
  
  /**
   * Oturumu kapat
   */
  signOut: async () => {
    return dbHelper.safeQuery(async () => {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      return { error: null };
    });
  },
  
  /**
   * Mevcut kullanıcıyı getir
   */
  getCurrentUser: async () => {
    return dbHelper.safeQuery(async () => {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      return { user: data?.user || null, error: null };
    });
  },
  
  /**
   * Kullanıcı profil bilgilerini getir
   */
  getProfile: async (userId) => {
    return dbHelper.safeQuery(async () => {
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id;
      }
      
      if (!userId) {
        return { data: null, error: new Error('Kullanıcı oturumu yok') };
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    });
  },
  
  /**
   * Kullanıcı profilini güncelle
   */
  updateProfile: async (profileData, userId) => {
    return dbHelper.safeQuery(async () => {
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id;
      }
      
      if (!userId) {
        return { data: null, error: new Error('Kullanıcı oturumu yok') };
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    });
  }
}; 