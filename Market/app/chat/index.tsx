import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Keyboard, Animated, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMessages } from '../../hooks/useMessages';
import { useRealTimeMessages } from '../../hooks/useRealTimeMessages';
import { getSocket } from '../../sockets/sockets';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

// Imported Modular Component Elements
import { ChatImageMessage } from '../../components/chat/ChatImageMessage';
import { ChatAudioMessage } from '../../components/chat/ChatAudioMessage';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [text, setText] = useState('');
  const socket = getSocket();
  
  const { messages, sendMessage } = useMessages(userId);
  const { isPeerTyping } = useRealTimeMessages(userId); 
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingEmitRef = useRef(false);

  const insets = useSafeAreaInsets();
  
  const translateY = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Voice Note Recording Tracker Parameters
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height, 
        duration: e.duration || 250,
        useNativeDriver: true,
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
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
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

    sendMessage({ content: text, type: 'text' });
    setText('');
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return alert("Storage access denied.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const targetAsset = result.assets[0];
      sendMessage({
        type: 'image',
        fileUri: targetAsset.uri,
        fileName: targetAsset.fileName || 'photo.jpg',
        fileType: targetAsset.mimeType || 'image/jpeg'
      });
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return alert("Microphone access denied.");

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Failed to initialize recording hardware.");
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording) return;
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        sendMessage({
          type: 'voice',
          fileUri: uri,
          fileName: `voice_note_${Date.now()}.m4a`,
          fileType: 'audio/m4a',
          duration: recordingDuration
        });
      }
    } catch (err) {
      alert("Error processing voice file compression parameters.");
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    try {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    } catch (e) {}
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: 16,
          paddingTop: insets.top || 16,
          paddingBottom: keyboardHeight > 0 ? (keyboardHeight + 80) : (insets.bottom + 80), 
          flexGrow: 1, 
          justifyContent: 'flex-end' 
        }} 
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isPeer = item.senderId === userId;
        return (
  <View className={`p-3 my-1 rounded-2xl ${isPeer ? 'bg-gray-100 self-start' : 'bg-blue-600 self-end'}`}>
    {item.messageType === 'image' || (item.attachment && !item.voiceDuration) ? (
      <ChatImageMessage uri={item.attachment || item.content || ''} />
    ) : item.messageType === 'voice' || item.voiceDuration ? (
      <ChatAudioMessage 
        fileUrl={item.attachment || item.content || ''} 
        duration={item.voiceDuration || 0} 
        isPeer={isPeer} 
      />
    ) : (
      <Text className={isPeer ? 'text-gray-900 text-sm' : 'text-white text-sm'}>
        {item.content}
      </Text>
    )}
  </View>
);

        }}
      />

      {isPeerTyping && (
        <Animated.View style={{ bottom: insets.bottom + 75, transform: [{ translateY }] }} className="absolute left-4 px-4 py-1 z-10">
          <Text className="text-xs text-gray-400 font-medium italic">Typing...</Text>
        </Animated.View>
      )}

      <Animated.View 
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 16,
          backgroundColor: '#FFFFFF', transform: [{ translateY }]
        }}
      >
        <View className="flex-row items-center gap-2 border-t border-gray-100 pt-3 bg-white">
          {isRecording ? (
            <View className="flex-1 bg-red-50 h-11 px-4 rounded-xl flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 bg-red-600 rounded-full" />
                <Text className="text-red-600 text-sm font-bold">Recording {formatDuration(recordingDuration)}</Text>
              </View>
              <TouchableOpacity onPress={cancelRecording} className="p-1">
                <Text className="text-gray-500 font-bold text-xs">CANCEL</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={handlePickImage} className="w-11 h-11 bg-gray-50 border border-gray-100 rounded-xl items-center justify-center">
                <Ionicons name="image-outline" size={20} color="#4B5563" />
              </TouchableOpacity>

              <TextInput
                value={text}
                onChangeText={handleTextChange} 
                placeholder="Type a message..."
                style={{ height: 44 }}
                className="flex-1 bg-gray-50 px-4 rounded-xl text-sm text-gray-900"
              />
            </>
          )}

          {text.trim().length > 0 ? (
            <TouchableOpacity onPress={handleSend} className="w-11 h-11 bg-blue-600 rounded-xl items-center justify-center">
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={isRecording ? stopRecordingAndSend : startRecording} 
              className={`w-11 h-11 rounded-xl items-center justify-center ${isRecording ? 'bg-red-600' : 'bg-gray-800'}`}
            >
            <Ionicons name={isRecording ? "stop" : "mic-outline"} size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}
