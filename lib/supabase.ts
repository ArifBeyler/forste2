import AsyncStorage from '@react-native-async-storage/async-storage';

// Kullanıcı verilerini saklamak için basit anahtar
const USER_STORAGE_KEY = 'supabase.user';

// Mockup kullanıcı verileri
const mockUsers = [
  {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    user_metadata: {
      name: 'Test User',
      birthdate: '1990-01-01'
    }
  }
];

// Basit kimlik doğrulama işlemleri için mockup API
export const supabase = {
  auth: {
    // Mock oturum açma fonksiyonu
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return { 
          data: { user, session: { user } }, 
          error: null 
        };
      }
      
      return { data: null, error: { message: 'Invalid login credentials' } };
    },
    
    // Mock kayıt fonksiyonu
    signUp: async ({ email, password, options }: { email: string; password: string; options: any }) => {
      const exists = mockUsers.some(u => u.email === email);
      
      if (exists) {
        return { data: null, error: { message: 'User already exists' } };
      }
      
      const newUser = {
        id: String(mockUsers.length + 1),
        email,
        password,
        user_metadata: options?.data || {}
      };
      
      // Gerçek uygulamada bu kısım olmazdı - sadece mockup için
      mockUsers.push(newUser);
      
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      
      return { 
        data: { user: newUser, session: { user: newUser } }, 
        error: null 
      };
    },
    
    // Oturumu kontrol et
    getSession: async () => {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      
      if (userData) {
        const user = JSON.parse(userData);
        return { data: { session: { user } }, error: null };
      }
      
      return { data: { session: null }, error: null };
    },
    
    // Oturum değişikliklerini izle
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Gerçek uygulamada burada bir event listener olurdu
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    },
    
    // Oturumu kapat
    signOut: async () => {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      return { error: null };
    },
    
    // Kullanıcı bilgilerini güncelle
    updateUser: async (updates: any) => {
      try {
        const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
        
        if (userData) {
          const user = JSON.parse(userData);
          const updatedUser = {
            ...user,
            user_metadata: { 
              ...user.user_metadata,
              ...updates.data
            }
          };
          
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          
          return { data: { user: updatedUser }, error: null };
        }
        
        return { data: null, error: { message: 'No active session' } };
      } catch (error) {
        return { data: null, error: { message: 'Failed to update user' } };
      }
    }
  },
  
  // Basit veritabanı operasyonları için mockup
  from: (table: string) => ({
    insert: () => ({ error: null }),
    update: () => ({ error: null }),
    select: () => ({ data: [], error: null }),
    eq: () => ({ data: [], error: null })
  })
}; 