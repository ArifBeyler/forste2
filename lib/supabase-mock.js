// Supabase Realtime Mock
// Amacı: React Native'de Supabase realtime bağımlılığı sorununu çözmek
// Bu modül, @supabase/realtime-js paketinin yerine kullanılabilir

// Sahte bir RealtimeClient sınıfı oluştur
class RealtimeClient {
  constructor(endpoint, options) {
    this.endpoint = endpoint;
    this.options = options;
    console.warn('RealtimeClient disabled in React Native');
  }

  // Sahte channel metodu
  channel(name) {
    return {
      subscribe: () => ({ unsubscribe: () => {} }),
      on: () => this,
      off: () => this,
      send: () => false
    };
  }

  // Sahte connect metodu
  connect() {
    return this;
  }

  // Sahte disconnect metodu
  disconnect() {
    return this;
  }

  // Sahte metotlar
  removeChannel() { return this; }
  setAuth() { return this; }
  getToken() { return null; }
}

// Sahte bir RealtimeChannel sınıfı oluştur
class RealtimeChannel {
  constructor() {
    console.warn('RealtimeChannel disabled in React Native');
  }
  
  // Sahte metotlar
  subscribe() { return { unsubscribe: () => {} }; }
  on() { return this; }
  off() { return this; }
  send() { return false; }
}

// Sahte bir RealtimePresence sınıfı oluştur
class RealtimePresence {
  constructor() {
    console.warn('RealtimePresence disabled in React Native');
  }
}

// Dışa aktar
module.exports = {
  RealtimeClient,
  RealtimeChannel,
  RealtimePresence,
  // Diğer olası ihraçları da ekle
  REALTIME_LISTEN_TYPES: {
    BROADCAST: 'broadcast',
    PRESENCE: 'presence',
    POSTGRES_CHANGES: 'postgres_changes'
  },
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT: {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    "*": "*" 
  },
  REALTIME_SUBSCRIBE_STATES: {
    SUBSCRIBED: 'SUBSCRIBED',
    TIMED_OUT: 'TIMED_OUT',
    CLOSED: 'CLOSED',
    CHANNEL_ERROR: 'CHANNEL_ERROR',
  }
}; 