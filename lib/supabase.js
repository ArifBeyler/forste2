import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fddpxhoregphgcayvdkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZHB4aG9yZWdwaGdjYXl2ZGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODU5NzMsImV4cCI6MjA2MTg2MTk3M30.W_v0hR2k7csvkqOs_vg_J_GZKFvb7ZzHiWsnIS3Zsxs';
 
// Supabase istemcisi oluştur - realtime tamamen devre dışı
const supabaseOptions = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Realtime özelliğini devre dışı bırak
  realtime: {
    transport: false, // WebSocket devre dışı
  },
  // React Native ortamı için ayarlar
  global: {
    isReactNative: true,
    headers: {
      'X-Client-Info': 'react-native'
    }
  }
};

// Boş yedek Supabase istemcisi
const fallbackClient = {
  auth: {
    signIn: () => Promise.resolve(null),
    signOut: () => Promise.resolve(null),
    onAuthStateChange: () => ({ data: null, error: null }),
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
};

// Supabase istemcisini oluştur veya hata durumunda yedek istemciyi kullan
let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);
  
  // Global erişim için (bazı modüller için faydalı olabilir)
  global.supabase = supabaseClient;
} catch (error) {
  console.error('Supabase istemcisi oluşturulurken hata:', error);
  supabaseClient = fallbackClient;
}

// Modül dışına aktar
export const supabase = supabaseClient; 