import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: 'Merhaba! Ben ForsteAI, size nasıl yardımcı olabilirim?', isUser: false, time: '09:03' },
    { id: 2, text: 'Bugünkü planlarımı göster', isUser: true, time: '09:04' },
    { id: 3, text: 'Bugün için 2 görev ve 1 toplantı planlanmış. Toplantınız saat 15:00\'te başlayacak. Görevlerinizi listelememi ister misiniz?', isUser: false, time: '09:04' },
  ]);
  
  const flatListRef = useRef(null);
  
  // Mesaj gönderme
  const handleSend = () => {
    if (message.trim() === '') return;
    
    // Kullanıcı mesajını ekle
    const newUserMessage = {
      id: messages.length + 1,
      text: message,
      isUser: true,
      time: getCurrentTime(),
    };
    
    setMessages([...messages, newUserMessage]);
    setMessage('');
    
    // Bot cevabını simüle et
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: 'Anladım. Size bu konuda yardımcı olabilirim. Daha fazla detay verebilir misiniz?',
        isUser: false,
        time: getCurrentTime(),
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    }, 1000);
  };
  
  // Şu anki saati al
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Mesaj bileşeni
  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessageContainer : styles.botMessageContainer
    ]}>
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>AI</Text>
        </View>
      )}
      <View style={[
        styles.messageBubble, 
        item.isUser ? styles.userMessageBubble : styles.botMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isUser ? styles.userMessageText : styles.botMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
    </View>
  );
  
  // Başlangıçta listenin en altına kaydır
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Başlık */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Asistan</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      {/* Mesaj listesi */}
      <ScrollView 
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      >
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            style={[
              styles.messageContainer,
              msg.isUser ? styles.userMessageContainer : styles.botMessageContainer
            ]}
          >
            {!msg.isUser && (
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>AI</Text>
              </View>
            )}
            <View 
              style={[
                styles.messageBubble,
                msg.isUser ? styles.userMessageBubble : styles.botMessageBubble
              ]}
            >
              <Text 
                style={[
                  styles.messageText,
                  msg.isUser ? styles.userMessageText : styles.botMessageText
                ]}
              >
                {msg.text}
              </Text>
              <Text 
                style={[
                  styles.messageTime,
                  msg.isUser ? styles.userMessageTime : styles.botMessageTime
                ]}
              >
                {msg.time}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
      {/* Mesaj girişi */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            !message.trim() && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={message.trim() ? '#FFFFFF' : '#A1A1AA'} 
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerButton: {
    padding: 4,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#047857',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  botAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '100%',
  },
  userMessageBubble: {
    backgroundColor: '#047857',
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  userMessageTime: {
    color: 'white',
  },
  botMessageTime: {
    color: '#1F2937',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#047857',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
}); 