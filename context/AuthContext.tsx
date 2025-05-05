import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Kullanıcı ve oturum tipleri
interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    birthdate?: string;
    registrationComplete?: boolean;
  };
}

interface Session {
  user: User;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isRegistrationComplete: boolean;
  signUp: (email: string, password: string, name: string, birthdate: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { 
    name?: string, 
    birthdate?: string, 
    userInfo?: {
      height?: string,
      weight?: string,
      activityLevel?: string,
      interests?: string[],
    } 
  }) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  completeOnboarding: () => Promise<{
    success: boolean;
    error: string | null;
  }>;
  completeRegistration: () => Promise<{
    success: boolean;
    error: string | null;
  }>;
  refreshUser: (retryCount?: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider props type
interface AuthProviderProps {
  children: React.ReactNode;
  navigate?: (name: string, params?: any) => void;
  reset?: (state: any) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, navigate, reset }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);

  // İlk yükleme ve oturum durumu kontrolü
  useEffect(() => {
    // Oturum kontrolü için işlev
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Mevcut oturumu kontrol et
        const { data, error } = await supabase.auth.getSession();
        
        if (!error && data.session) {
          console.log("Aktif oturum bulundu:", data.session.user.email);
          setSession(data.session);
          setUser(data.session.user);
          
          // Kullanıcı kayıt sürecini tamamlamış mı kontrol et
          const registrationComplete = data.session.user.user_metadata?.registrationComplete === true;
          setIsRegistrationComplete(registrationComplete);
        } else {
          console.log("Aktif oturum bulunamadı");
          setSession(null);
          setUser(null);
          setIsRegistrationComplete(false);
        }
      } catch (error) {
        console.error("Oturum kontrolünde hata:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    // Başlangıçta oturum durumunu kontrol et
    checkSession();

    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state değişti:", event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Kullanıcı oturum açtığında ana ekrana yönlendir
        if (event === 'SIGNED_IN' && reset) {
          reset({
            index: 0,
            routes: [{ name: 'App' }],
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        
        // Kullanıcı çıkış yaptığında giriş ekranına yönlendir
        if (reset) {
          reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [reset]);

  const signUp = async (email: string, password: string, name: string, birthdate: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            birthdate,
            onboardingCompleted: false,
            registrationComplete: false,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Kayıt bilgilerini yerel depolamaya kaydet
      await AsyncStorage.setItem('userToken', data.session?.access_token || '');
      
      // Kullanıcı bilgilerini hemen güncelle
      await refreshUser();
      
      // Kullanıcı başarıyla kaydoldu, ama henüz onboarding'i tamamlamadı
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Oturum bilgilerini yerel depolamaya kaydet
      await AsyncStorage.setItem('userToken', data.session?.access_token || '');
      
      // Kullanıcı bilgilerini hemen güncelle
      await refreshUser();
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const signOut = async () => {
    try {
      // Yerel depolamadan token'ı temizle
      await AsyncStorage.removeItem('userToken');
      
      // Supabase oturumunu kapat
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const updateProfile = async (data: { 
    name?: string; 
    birthdate?: string; 
    userInfo?: {
      height?: string;
      weight?: string;
      activityLevel?: string;
      interests?: string[];
    }
  }) => {
    try {
      if (!user) {
        return { success: false, error: 'Kullanıcı oturumu açık değil' };
      }

      // Veri güncelleme için hazırla
      const updatedData = { ...data };
      if (data.userInfo) {
        // userInfo içindeki verileri düz yapıya dönüştür
        updatedData.height = data.userInfo.height;
        updatedData.weight = data.userInfo.weight;
        updatedData.activityLevel = data.userInfo.activityLevel;
        updatedData.interests = data.userInfo.interests;
        // userInfo alanını kaldır
        delete updatedData.userInfo;
      }

      // Kullanıcı bilgilerini güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        data: updatedData,
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  // Onboarding durumunu güncellemek için yeni fonksiyon
  const completeOnboarding = async () => {
    try {
      if (!user) {
        return { success: false, error: 'Kullanıcı oturumu açık değil' };
      }

      // Kullanıcı onboarding'i tamamladı olarak güncelle
      const { error } = await supabase.auth.updateUser({
        data: {
          onboardingCompleted: true,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  // Kayıt sürecini tamamlama işlevi
  const completeRegistration = async () => {
    try {
      if (!user) {
        return { success: false, error: 'Kullanıcı oturumu açık değil' };
      }

      // Kullanıcı kayıt sürecini tamamladı olarak güncelle
      const { error } = await supabase.auth.updateUser({
        data: {
          registrationComplete: true,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Durumu güncelle
      setIsRegistrationComplete(true);
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  // Kullanıcı bilgilerini yenilemek için fonksiyon
  const refreshUser = async (retryCount = 3): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (data?.user) {
        setUser(data.user);
        return true;
      } 
      
      if (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error.message);
      }
      
      // Eğer kullanıcı bilgisi alınamadıysa ve deneme hakkımız varsa tekrar dene
      if (retryCount > 0) {
        // setTimeout yerine hemen tekrar dene - daha hızlı yanıt için
        console.log(`Kullanıcı bilgileri alınamadı, tekrar deneniyor. Kalan deneme: ${retryCount}`);
        return await refreshUser(retryCount - 1);
      }
      
      return false;
    } catch (error) {
      console.error('Kullanıcı bilgileri güncellenirken beklenmeyen hata:', error);
      
      // Beklenmeyen hata durumunda ve deneme hakkımız varsa tekrar dene
      if (retryCount > 0) {
        return await refreshUser(retryCount - 1);
      }
      
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isRegistrationComplete,
        signUp,
        signIn,
        signOut,
        updateProfile,
        completeOnboarding,
        completeRegistration,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 