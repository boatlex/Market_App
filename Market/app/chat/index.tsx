import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Keyboard, Animated, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMessages } from '../../hooks/useMessages';
import { useRealTimeMessages } from '../../hooks/useRealTimeMessages';
import { getSocket } from '../../sockets/sockets';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [text, setText] = useState('');
  const socket = getSocket();
  
  const { messages, sendMessage, isSending } = useMessages(userId);
  const { isPeerTyping } = useRealTimeMessages(userId); 
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingEmitRef = useRef(false);

  const insets = useSafeAreaInsets();
  
  // 1. Core Fix: Create an animation tracking ref for a translation layout block
  const translateY = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      Animated.timing(translateY, {
        // We invert the value to push the input up along the Y axis
        toValue: -e.endCoordinates.height, 
        duration: e.duration || 250,
        useNativeDriver: true, // ⚡ Crucial: Runs perfectly at 60FPS natively
      }).start();
    });

    const hideSubscription = Keyboard.addListener(hideEvent, (e) => {
      setKeyboardHeight(0);
      Animated.timing(translateY, {
        toValue: 0,
        duration: e.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);


const handleTextChange = (inputText: string) => {
    setText(inputText);

    if (!socket || !socket.connected) return;

    if (!isCurrentlyTypingEmitRef.current && inputText.trim().length > 0) {
      socket.emit('typing', { receiverId: userId });
      isCurrentlyTypingEmitRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (inputText.trim().length === 0) {
      socket.emit('stopTyping', { receiverId: userId });
      isCurrentlyTypingEmitRef.current = false;
      return;
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { receiverId: userId });
      isCurrentlyTypingEmitRef.current = false;
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit('stopTyping', { receiverId: userId });
    isCurrentlyTypingEmitRef.current = false;

    sendMessage({ content: text });
    setText('');
  };

    useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      
      {/* 2. Chat list container matches the full available height boundaries */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: 16,
          paddingTop: insets.top || 16,
          // Shrinks the content track dynamically so the active items lift up above the footer
          paddingBottom: keyboardHeight > 0 ? (keyboardHeight + 70) : (insets.bottom + 70), 
          flexGrow: 1, 
          justifyContent: 'flex-end' 
        }} 
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View className={`p-3 my-1 max-w-[80%] rounded-2xl ${item.senderId === userId ? 'bg-gray-100 align-self-start' : 'bg-blue-600 align-self-end'}`}>
            <Text className={item.senderId === userId ? 'text-gray-900' : 'text-white'}>{item.content}</Text>
          </View>
        )}
      />

      {/* REAL-TIME TYPING INDICATOR */}
      {isPeerTyping && (
        <Animated.View 
          style={{ 
            bottom: insets.bottom + 65,
            transform: [{ translateY }] // Moves identically alongside your input container box
          }} 
          className="absolute left-4 px-4 py-1 flex-row items-center gap-1 z-10"
        >
          <Text className="text-xs text-gray-400 font-medium italic">Typing...</Text>
        </Animated.View>
      )}

      {/* 
        3. THE RIGID INTERACTIVE FOOTER BAR
        We use style translation instead of padding modifications. 
        This means the input field maintains its absolute original layout proportions.
      */}
      <Animated.View 
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0, // Starts pinned to the device window edge
          paddingBottom: Math.max(insets.bottom, 16), // Maintains native layout padding boundaries
          paddingHorizontal: 16,
          backgroundColor: '#FFFFFF',
          transform: [{ translateY }] // Slides up smoothly like a solid brick without structural shrinking
        }}
      >
        <View className="flex-row items-center gap-2 border-t border-gray-100 pt-3 bg-white">
          <TextInput
            value={text}
            onChangeText={handleTextChange} 
            placeholder="Type a message..."
            style={{ height: 44 }} // Force an absolute structural height metric
            className="flex-1 bg-gray-50 px-4 rounded-xl text-sm text-gray-900"
          />
          <TouchableOpacity onPress={handleSend} className="w-11 h-11 bg-blue-600 rounded-xl items-center justify-center">
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}


