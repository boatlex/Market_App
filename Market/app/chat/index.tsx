import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMessages } from '../../hooks/useMessages';
import { useRealTimeMessages } from '../../hooks/useRealTimeMessages';
import { getSocket } from '../../sockets/sockets';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';

// Imported Modular Component Elements
import { ChatImageMessage } from '../../components/chat/ChatImageMessage';
import { ChatAudioMessage } from '../../components/chat/ChatAudioMessage';
import { MemePickerSheet, MemeItem } from '../../components/chat/MemePickerSheet';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [text, setText] = useState('');
  const [showMemePicker, setShowMemePicker] = useState(false);
  const socket = getSocket();

  const { messages, sendMessage } = useMessages(userId);
  const { isPeerTyping } = useRealTimeMessages(userId);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingEmitRef = useRef(false);

  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Voice Note Recording Tracker Parameters using modern expo-audio recorder engine hooks
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
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

  const handleSendMeme = (meme: MemeItem) => {
    setShowMemePicker(false);
    sendMessage({
      content: `[MEME]|${meme.emoji}|${meme.topText}|${meme.bottomText}|${meme.bgColor}|${meme.textColor}`,
      type: 'text',
    });
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return alert('Storage access denied.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const targetAsset = result.assets[0];
      sendMessage({
        type: 'image',
        fileUri: targetAsset.uri,
        fileName: targetAsset.fileName || 'photo.jpg',
        fileType: targetAsset.mimeType || 'image/jpeg',
      });
    }
  };

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) return alert('Microphone access denied.');

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setIsRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Failed to initialize recording hardware.');
    }
  };

  const stopRecordingAndSend = async () => {
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (uri) {
        sendMessage({
          type: 'voice',
          fileUri: uri,
          fileName: `voice_note_${Date.now()}.m4a`,
          fileType: 'audio/m4a',
          duration: recordingDuration,
        });
      }
    } catch (err) {
      alert('Error processing voice file compression parameters.');
    }
  };

  const cancelRecording = async () => {
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    try {
      await audioRecorder.stop();
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
          paddingBottom:
            keyboardHeight > 0
              ? keyboardHeight + 80
              : showMemePicker
              ? 300
              : insets.bottom + 80,
          flexGrow: 1,
          justifyContent: 'flex-end',
        }}
        keyboardShouldPersistTaps="handled"

        
              renderItem={({ item }) => {
          const isPeer = item.senderId === userId;
          const content = item.content ?? '';
          const isMeme = content.startsWith('[MEME]|');
          const memeParts = isMeme ? content.split('|') : [];

          return (
            <View
              className={`my-1 rounded-2xl ${
                isMeme
                  ? 'p-1 bg-transparent'
                  : `p-3 ${isPeer ? 'bg-gray-100' : 'bg-blue-600'}`
              } ${isPeer ? 'self-start' : 'self-end'}`}
            >
              {isMeme ? (
                <View
                  style={{ backgroundColor: memeParts[4] || '#FEF3C7' }}
                  className="p-3.5 rounded-2xl items-center min-w-[165px] border border-black/5"
                >
                  <Text className="text-4xl mb-1.5">{memeParts[1]}</Text>
                  <Text
                    style={{ color: memeParts[5] || '#92400E' }}
                    className="text-xs font-extrabold text-center"
                  >
                    {memeParts[2]}
                  </Text>
                  <Text
                    style={{ color: memeParts[5] || '#92400E' }}
                    className="text-sm font-black text-center mt-0.5"
                  >
                    {memeParts[3]}
                  </Text>
                </View>
              ) : item.messageType === 'image' || (item.attachment && !item.voiceDuration) ? (
                <ChatImageMessage uri={item.attachment || content} />
              ) : item.messageType === 'voice' || item.voiceDuration ? (
                <ChatAudioMessage
                  fileUrl={item.attachment || content}
                  duration={item.voiceDuration || 0}
                  isPeer={isPeer}
                />
              ) : (
                <Text className={isPeer ? 'text-gray-900 text-sm' : 'text-white text-sm'}>
                  {content}
                </Text>
              )}
            </View>
          );
        }}
      />

      {isPeerTyping && (
        <Animated.View
          style={{
            bottom: showMemePicker ? insets.bottom + 295 : insets.bottom + 75,
            transform: [{ translateY }],
          }}
          className="absolute left-4 px-4 py-1 z-10"
        >
          <Text className="text-xs text-gray-400 font-medium italic">Typing...</Text>
        </Animated.View>
      )}

      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: '#FFFFFF',
          transform: [{ translateY }],
        }}
      >
              {/* Reaction Meme Picker Drawer */}
        <MemePickerSheet
          visible={showMemePicker}
          onSelectMeme={handleSendMeme}
          onClose={() => setShowMemePicker(false)}
        />

        <View className="flex-row items-end gap-2 border-t border-gray-100 px-4 pt-2.5">
          {isRecording ? (
            <View className="flex-1 flex-row items-center justify-between bg-red-50 px-4 py-2.5 rounded-full">
              <TouchableOpacity onPress={cancelRecording}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
              <Text className="text-red-600 font-bold text-sm">
                Recording {formatDuration(recordingDuration)}
              </Text>
              <TouchableOpacity
                onPress={stopRecordingAndSend}
                className="bg-red-600 p-2 rounded-full"
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Meme Picker Toggle Button (Left) */}
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowMemePicker((prev) => !prev);
                }}
                className={`p-2.5 rounded-full ${
                  showMemePicker ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <Ionicons
                  name="happy-outline"
                  size={20}
                  color={showMemePicker ? '#2563EB' : '#4B5563'}
                />
              </TouchableOpacity>

              {/* Text Input (Center) */}
              <TextInput
                value={text}
                onChangeText={handleTextChange}
                onFocus={() => setShowMemePicker(false)}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                multiline
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 max-h-24"
              />

              {/* Attach & Send / Voice Note Buttons (Right) */}
              <View className="flex-row items-center gap-1.5">
                <TouchableOpacity
                  onPress={() => {
                    setShowMemePicker(false);
                    handlePickImage();
                  }}
                  className="p-2.5 bg-gray-100 rounded-full"
                >
                  <Ionicons name="attach-outline" size={20} color="#4B5563" />
                </TouchableOpacity>

                {text.trim().length > 0 ? (
                  <TouchableOpacity
                    onPress={handleSend}
                    className="p-2.5 bg-blue-600 rounded-full"
                  >
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setShowMemePicker(false);
                      startRecording();
                    }}
                    className="p-2.5 bg-gray-100 rounded-full"
                  >
                    <Ionicons name="mic-outline" size={20} color="#4B5563" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}
