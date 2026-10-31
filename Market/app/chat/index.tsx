import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMessages } from '../../hooks/useMessages';
import { useRealTimeMessages } from '../../hooks/useRealTimeMessages';
import { getSocket } from '../../sockets/sockets';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [text, setText] = useState('');
  const { socket } = getSocket();
  
  const { messages, sendMessage, isSending } = useMessages(userId);
  const { isPeerTyping } = useRealTimeMessages(userId); // 🚀 Read the typing status state
  
 const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingEmitRef = useRef(false);

  // Handle local user typing change events
  const handleTextChange = (inputText: string) => {
    setText(inputText);

    if (!socket || !socket.connected) return;

    // If we haven't told the server we're typing yet, emit it now
    if (!isCurrentlyTypingEmitRef.current && inputText.trim().length > 0) {
      socket.emit('typing', { receiverId: userId });
      isCurrentlyTypingEmitRef.current = true;
    }

    // Clear previous debounce timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // If the input is empty, immediately emit stopTyping
    if (inputText.trim().length === 0) {
      socket.emit('stopTyping', { receiverId: userId });
      isCurrentlyTypingEmitRef.current = false;
      return;
    }

    // Debounce: Wait 2 seconds of stillness before emitting stopTyping
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { receiverId: userId });
      isCurrentlyTypingEmitRef.current = false;
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    
    // Clear typing emissions immediately upon clicking send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit('stopTyping', { receiverId: userId });
    isCurrentlyTypingEmitRef.current = false;

    sendMessage({ content: text });
    setText('');
  };

  // Clean up timers when navigating away
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <View className="flex-1 bg-white p-4">
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View className={`p-3 my-1 max-w-[80%] rounded-2xl ${item.senderId === userId ? 'bg-gray-100 align-self-start' : 'bg-blue-600 align-self-end'}`}>
            <Text className={item.senderId === userId ? 'text-gray-900' : 'text-white'}>{item.content}</Text>
          </View>
        )}
      />

      {/* 🚀 REAL-TIME TYPING INDICATOR UI LAYER */}
      {isPeerTyping && (
        <View className="px-4 py-2 flex-row items-center gap-1">
          <Text className="text-xs text-gray-400 font-medium italic">Typing...</Text>
        </View>
      )}

      {/* Input Box Footer */}
      <View className="flex-row items-center gap-2 mt-2 border-t border-gray-100 pt-2">
        <TextInput
          value={text}
          onChangeText={handleTextChange} 
          placeholder="Type a message..."
          className="flex-1 bg-gray-50 h-11 px-4 rounded-xl text-sm"
        />
        <TouchableOpacity onPress={handleSend} className="w-11 h-11 bg-blue-600 rounded-xl items-center justify-center">
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
