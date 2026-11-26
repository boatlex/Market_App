import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMessages } from '../../hooks/useMessages';
import { useRealTimeMessages } from '../../hooks/useRealTimeMessages';
import { usePublicUserProfile } from '../../hooks/usePublicUserProfile';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useAuth } from '../../contexts/authContext';
import useNotifications from '../../hooks/useNotifications';
import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';
import { getSocket } from '../../sockets/sockets';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';

import { ChatImageMessage } from '../../components/chat/ChatImageMessage';
import { ChatAudioMessage } from '../../components/chat/ChatAudioMessage';
import { MemePickerSheet, MemeItem } from '../../components/chat/MemePickerSheet';
import { capitalizeFirstLetter } from '../../lib/utils';

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    userId?: string | string[];
    id?: string | string[];
  }>();
  const rawUserId = params.userId ?? params.id;
  const [targetUserId] = Array.isArray(rawUserId) ? rawUserId : [rawUserId];

  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const isAdmin = currentUser?.role === 'admin';

  const [text, setText] = useState('');
  const [showMemePicker, setShowMemePicker] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const socket = getSocket();

  const { messages, sendMessage } = useMessages(targetUserId || '');
  const { isPeerTyping } = useRealTimeMessages(targetUserId || '');
  const { data: peerData } = usePublicUserProfile(targetUserId);
  const { isUserOnline } = useOnlineUsers();

  const peerUser = peerData?.user;
  const peerOnline = isUserOnline(targetUserId);

  const peerName = useMemo(() => {
    if (!peerUser) return 'Conversation';
    return `${peerUser.firstName || ''} ${peerUser.lastName || ''}`.trim() || 'Member';
  }, [peerUser]);

  const peerFallbackInitial = useMemo(() => {
    const first = peerUser?.firstName || peerUser?.lastName || 'U';
    return capitalizeFirstLetter(first.charAt(0));
  }, [peerUser]);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingEmitRef = useRef(false);

  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  const handleBack = () => {
    const canGoBack =
      Platform.OS === 'web'
        ? typeof window !== 'undefined' && window.history.length > 1 && router.canGoBack()
        : router.canGoBack();

    if (canGoBack) {
      router.back();
    } else {
      router.replace('/(tabs)/messages' as any);
    }
  };

  const handleOpenPeerProfile = () => {
    if (!targetUserId) return;
    router.push({
      pathname: '/user/[id]',
      params: { id: String(targetUserId) },
    });
  };

  const handleTextChange = (inputText: string) => {
    setText(inputText);
    if (!socket || !socket.connected || !targetUserId) return;

    if (!isCurrentlyTypingEmitRef.current && inputText.trim().length > 0) {
      socket.emit('typing', { receiverId: targetUserId });
      isCurrentlyTypingEmitRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (inputText.trim().length === 0) {
      socket.emit('stopTyping', { receiverId: targetUserId });
      isCurrentlyTypingEmitRef.current = false;
      return;
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { receiverId: targetUserId });
      isCurrentlyTypingEmitRef.current = false;
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim() || !targetUserId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit('stopTyping', { receiverId: targetUserId });
    isCurrentlyTypingEmitRef.current = false;

    sendMessage({ content: text, type: 'text' });
    setText('');
  };

  const handleSendMeme = (meme: MemeItem) => {
    if (!targetUserId) return;
    setShowMemePicker(false);
    sendMessage({
      content: `[MEME]|${meme.emoji}|${meme.topText}|${meme.bottomText}|${meme.bgColor}|${meme.textColor}`,
      type: 'text',
    });
  };

  
  const handlePickImage = async () => {
    if (!targetUserId) {
      alert('Recipient user ID is missing.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Storage access denied.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const [targetAsset] = result.assets;
      sendMessage({
        type: 'image',
        fileUri: targetAsset.uri,
        fileName: targetAsset.fileName || 'photo.jpg',
        fileType: targetAsset.mimeType || 'image/jpeg',
      });
    }
  };

  const startRecording = async () => {
    if (!targetUserId) return;
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

      if (uri && targetUserId) {
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
    <View style={{ flex: 1 }} className="bg-white md:bg-gray-50">
      {/* Top Bar with Back Arrow, Tappable Recipient Profile & Menu Drawer Toggle */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 12),
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
        className="w-full bg-white border-b border-gray-100 z-10"
      >
        <View className="w-full max-w-2xl self-center px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="mr-3 p-1"
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>

            {/* Tapping Avatar or Name opens Public User Profile */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleOpenPeerProfile}
              className="flex-row items-center flex-1"
            >
              <View className="relative mr-3 shrink-0">
                <View className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden items-center justify-center">
                  {peerUser?.profilePicture ? (
                    <Image
                      source={{ uri: peerUser.profilePicture }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-blue-100">
                      <Text className="text-blue-600 font-bold text-sm">
                        {peerFallbackInitial}
                      </Text>
                    </View>
                  )}
                </View>

                {peerOnline && (
                  <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                    {peerName}
                  </Text>
                  {peerUser?.verified && (
                    <Ionicons name="checkmark-circle" size={15} color="#2563EB" />
                  )}
                </View>

                <Text
                  className={`text-xs ${
                    isPeerTyping
                      ? 'text-blue-600 font-semibold'
                      : peerOnline
                      ? 'text-green-600 font-medium'
                      : 'text-gray-400'
                  }`}
                  numberOfLines={1}
                >
                  {isPeerTyping
                    ? 'Typing...'
                    : peerOnline
                    ? 'Online • Tap to view profile'
                    : 'Tap to view profile'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setIsMenuOpen(true)}
            activeOpacity={0.75}
            style={{ width: 42, height: 42 }}
            className="bg-gray-900 rounded-xl items-center justify-center relative shrink-0"
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

           {/* Full-Width Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item, index) => item?._id || String(index)}
        style={{ flex: 1, width: '100%' }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 672,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom:
            keyboardHeight > 0
              ? keyboardHeight + 90
              : showMemePicker
              ? 310
              : insets.bottom + 90,
          ...(Platform.OS !== 'web'
            ? { flexGrow: 1, justifyContent: 'flex-end' }
            : {}),
        }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isPeer = String(item.senderId) === String(targetUserId);
          const content = item.content ?? '';
          const mediaUrl = item.attachment || content;
          const isMeme = content.startsWith('[MEME]|');
          const [, memeEmoji, memeTop, memeBottom, memeBg, memeColor] = isMeme
            ? content.split('|')
            : [];

          return (
            <View
              className={`my-1 rounded-2xl max-w-[80%] ${
                isMeme
                  ? 'p-1 bg-transparent'
                  : item.messageType === 'image'
                  ? 'p-1.5 bg-transparent'
                  : `p-3 ${
                      isPeer
                        ? 'bg-gray-100 md:bg-white md:border md:border-gray-200/70'
                        : 'bg-blue-600'
                    }`
              } ${isPeer ? 'self-start' : 'self-end'}`}
            >
              {isMeme ? (
                <View
                  style={{ backgroundColor: memeBg || '#FEF3C7' }}
                  className="p-3.5 rounded-2xl items-center min-w-[165px] border border-black/5"
                >
                  <Text className="text-4xl mb-1.5">{memeEmoji}</Text>
                  <Text
                    style={{ color: memeColor || '#92400E' }}
                    className="text-xs font-extrabold text-center"
                  >
                    {memeTop}
                  </Text>
                  {Boolean(memeBottom) && (
                    <Text
                      style={{ color: memeColor || '#92400E' }}
                      className="text-[11px] font-bold text-center mt-0.5"
                    >
                      {memeBottom}
                    </Text>
                  )}
                </View>
              ) : item.messageType === 'image' ? (
                <ChatImageMessage uri={mediaUrl} />
              ) : item.messageType === 'voice' ? (
                <ChatAudioMessage
                  fileUrl={mediaUrl}
                  duration={item.voiceDuration ?? 0}
                  isPeer={isPeer}
                />
              ) : (
                <Text
                  className={`text-sm leading-5 ${
                    isPeer ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  {content}
                </Text>
              )}
            </View>
          );
        }}
      />

      {/* Animated Bottom Input / Voice / Meme Bar */}
      <Animated.View
        style={{
          transform: [{ translateY }],
          paddingBottom: Math.max(insets.bottom, 10),
        }}
        className="w-full bg-white border-t border-gray-100 pt-2.5 px-3"
      >
        <View className="w-full max-w-2xl self-center">
          {isRecording ? (
            <View className="flex-row items-center justify-between bg-red-50 border border-red-100 rounded-2xl px-4 py-2.5">
              <TouchableOpacity onPress={cancelRecording} className="p-1">
                <Ionicons name="trash-outline" size={22} color="#DC2626" />
              </TouchableOpacity>

              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <Text className="text-sm font-bold text-red-600">
                  Recording {formatDuration(recordingDuration)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={stopRecordingAndSend}
                className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center"
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-end gap-2">
              <TouchableOpacity
                onPress={() => setShowMemePicker((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons
                  name={showMemePicker ? 'close' : 'happy-outline'}
                  size={22}
                  color="#4B5563"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickImage}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="image-outline" size={21} color="#4B5563" />
              </TouchableOpacity>

              <View className="flex-1 bg-gray-100 rounded-2xl px-3.5 py-2 min-h-[42px] max-h-28 justify-center">
                <TextInput
                  value={text}
                  onChangeText={handleTextChange}
                  onFocus={() => setShowMemePicker(false)}
                  placeholder="Type a message..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  className="text-sm text-gray-900"
                />
              </View>

              {text.trim().length > 0 ? (
                <TouchableOpacity
                  onPress={handleSend}
                  className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center"
                >
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                               <TouchableOpacity
                  onPress={startRecording}
                  className="w-10 h-10 rounded-full bg-gray-900 items-center justify-center"
                >
                  <Ionicons name="mic-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {showMemePicker && (
            <View className="mt-2">
              <MemePickerSheet
                visible={showMemePicker}
                onClose={() => setShowMemePicker(false)}
                onSelectMeme={handleSendMeme}
              />
            </View>
          )}
        </View>
      </Animated.View>

      {/* Column Slide-Out Menu Drawer */}
      <ProfileMenuDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAdmin={isAdmin}
        unreadCount={unreadCount}
        side="right"
      />
    </View>
  );
}




// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   Keyboard,
//   Animated,
//   Platform,
// } from 'react-native';
// import { useLocalSearchParams } from 'expo-router';
// import { useMessages } from '../../hooks/useMessages';
// import { useRealTimeMessages } from '../../hooks/useRealTimeMessages';
// import { getSocket } from '../../sockets/sockets';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import * as ImagePicker from 'expo-image-picker';
// import {
//   useAudioRecorder,
//   requestRecordingPermissionsAsync,
//   setAudioModeAsync,
//   RecordingPresets,
// } from 'expo-audio';

// // Imported Modular Component Elements
// import { ChatImageMessage } from '../../components/chat/ChatImageMessage';
// import { ChatAudioMessage } from '../../components/chat/ChatAudioMessage';
// import { MemePickerSheet, MemeItem } from '../../components/chat/MemePickerSheet';

// export default function ChatScreen() {
  // const { userId } = useLocalSearchParams<{ userId: string }>();
  // const [text, setText] = useState('');
  // const [showMemePicker, setShowMemePicker] = useState(false);
  // const socket = getSocket();

//   const { messages, sendMessage } = useMessages(userId);
//   const { isPeerTyping } = useRealTimeMessages(userId);

//   const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const isCurrentlyTypingEmitRef = useRef(false);

//   const insets = useSafeAreaInsets();

//   const translateY = useRef(new Animated.Value(0)).current;
//   const [keyboardHeight, setKeyboardHeight] = useState(0);

//   // Voice Note Recording Tracker Parameters using modern expo-audio recorder engine hooks
//   const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingDuration, setRecordingDuration] = useState(0);
//   const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   useEffect(() => {
//     const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
//     const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

//     const showSubscription = Keyboard.addListener(showEvent, (e) => {
//       setKeyboardHeight(e.endCoordinates.height);
//       Animated.timing(translateY, {
//         toValue: -e.endCoordinates.height,
//         duration: e.duration || 250,
//         useNativeDriver: true,
//       }).start();
//     });

//     const hideSubscription = Keyboard.addListener(hideEvent, (e) => {
//       setKeyboardHeight(0);
//       Animated.timing(translateY, {
//         toValue: 0,
//         duration: e.duration || 250,
//         useNativeDriver: true,
//       }).start();
//     });

//     return () => {
//       showSubscription.remove();
//       hideSubscription.remove();
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//       if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
//     };
//   }, []);

//   const handleTextChange = (inputText: string) => {
//     setText(inputText);
//     if (!socket || !socket.connected) return;

//     if (!isCurrentlyTypingEmitRef.current && inputText.trim().length > 0) {
//       socket.emit('typing', { receiverId: userId });
//       isCurrentlyTypingEmitRef.current = true;
//     }

//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

//     if (inputText.trim().length === 0) {
//       socket.emit('stopTyping', { receiverId: userId });
//       isCurrentlyTypingEmitRef.current = false;
//       return;
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       socket.emit('stopTyping', { receiverId: userId });
//       isCurrentlyTypingEmitRef.current = false;
//     }, 2000);
//   };

//   const handleSend = () => {
//     if (!text.trim()) return;
//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     socket?.emit('stopTyping', { receiverId: userId });
//     isCurrentlyTypingEmitRef.current = false;

//     sendMessage({ content: text, type: 'text' });
//     setText('');
//   };

//   const handleSendMeme = (meme: MemeItem) => {
//     setShowMemePicker(false);
//     sendMessage({
//       content: `[MEME]|${meme.emoji}|${meme.topText}|${meme.bottomText}|${meme.bgColor}|${meme.textColor}`,
//       type: 'text',
//     });
//   };

//   const handlePickImage = async () => {
//     const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permissionResult.granted) return alert('Storage access denied.');

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ['images'],
//       allowsEditing: true,
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets && result.assets.length > 0) {
//       const targetAsset = result.assets[0];
//       sendMessage({
//         type: 'image',
//         fileUri: targetAsset.uri,
//         fileName: targetAsset.fileName || 'photo.jpg',
//         fileType: targetAsset.mimeType || 'image/jpeg',
//       });
//     }
//   };

//   const startRecording = async () => {
//     try {
//       const permission = await requestRecordingPermissionsAsync();
//       if (!permission.granted) return alert('Microphone access denied.');

//       await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

//       await audioRecorder.prepareToRecordAsync();
//       audioRecorder.record();

//       setIsRecording(true);
//       setRecordingDuration(0);

//       durationIntervalRef.current = setInterval(() => {
//         setRecordingDuration((prev) => prev + 1);
//       }, 1000);
//     } catch (err) {
//       alert('Failed to initialize recording hardware.');
//     }
//   };

//   const stopRecordingAndSend = async () => {
//     setIsRecording(false);
//     if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

//     try {
//       await audioRecorder.stop();
//       const uri = audioRecorder.uri;

//       if (uri) {
//         sendMessage({
//           type: 'voice',
//           fileUri: uri,
//           fileName: `voice_note_${Date.now()}.m4a`,
//           fileType: 'audio/m4a',
//           duration: recordingDuration,
//         });
//       }
//     } catch (err) {
//       alert('Error processing voice file compression parameters.');
//     }
//   };

//   const cancelRecording = async () => {
//     setIsRecording(false);
//     if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
//     try {
//       await audioRecorder.stop();
//     } catch (e) {}
//   };

//   const formatDuration = (secs: number) => {
//     const mins = Math.floor(secs / 60);
//     const rem = secs % 60;
//     return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
//       <FlatList
//         data={messages}
//         keyExtractor={(item) => item._id}
//         style={{ flex: 1 }}
//         contentContainerStyle={{
//           paddingHorizontal: 16,
//           paddingTop: insets.top || 16,
//           paddingBottom:
//             keyboardHeight > 0
//               ? keyboardHeight + 80
//               : showMemePicker
//               ? 300
//               : insets.bottom + 80,
//           flexGrow: 1,
//           justifyContent: 'flex-end',
//         }}
//         keyboardShouldPersistTaps="handled"

        
//               renderItem={({ item }) => {
//           const isPeer = item.senderId === userId;
//           const content = item.content ?? '';
//           const isMeme = content.startsWith('[MEME]|');
//           const memeParts = isMeme ? content.split('|') : [];

//           return (
//             <View
//               className={`my-1 rounded-2xl ${
//                 isMeme
//                   ? 'p-1 bg-transparent'
//                   : `p-3 ${isPeer ? 'bg-gray-100' : 'bg-blue-600'}`
//               } ${isPeer ? 'self-start' : 'self-end'}`}
//             >
//               {isMeme ? (
//                 <View
//                   style={{ backgroundColor: memeParts[4] || '#FEF3C7' }}
//                   className="p-3.5 rounded-2xl items-center min-w-[165px] border border-black/5"
//                 >
//                   <Text className="text-4xl mb-1.5">{memeParts[1]}</Text>
//                   <Text
//                     style={{ color: memeParts[5] || '#92400E' }}
//                     className="text-xs font-extrabold text-center"
//                   >
//                     {memeParts[2]}
//                   </Text>
//                   <Text
//                     style={{ color: memeParts[5] || '#92400E' }}
//                     className="text-sm font-black text-center mt-0.5"
//                   >
//                     {memeParts[3]}
//                   </Text>
//                 </View>
//               ) : item.messageType === 'image' || (item.attachment && !item.voiceDuration) ? (
//                 <ChatImageMessage uri={item.attachment || content} />
//               ) : item.messageType === 'voice' || item.voiceDuration ? (
//                 <ChatAudioMessage
//                   fileUrl={item.attachment || content}
//                   duration={item.voiceDuration || 0}
//                   isPeer={isPeer}
//                 />
//               ) : (
//                 <Text className={isPeer ? 'text-gray-900 text-sm' : 'text-white text-sm'}>
//                   {content}
//                 </Text>
//               )}
//             </View>
//           );
//         }}
//       />

//       {isPeerTyping && (
//         <Animated.View
//           style={{
//             bottom: showMemePicker ? insets.bottom + 295 : insets.bottom + 75,
//             transform: [{ translateY }],
//           }}
//           className="absolute left-4 px-4 py-1 z-10"
//         >
//           <Text className="text-xs text-gray-400 font-medium italic">Typing...</Text>
//         </Animated.View>
//       )}

//       <Animated.View
//         style={{
//           position: 'absolute',
//           left: 0,
//           right: 0,
//           bottom: 0,
//           paddingBottom: Math.max(insets.bottom, 16),
//           backgroundColor: '#FFFFFF',
//           transform: [{ translateY }],
//         }}
//       >
//               {/* Reaction Meme Picker Drawer */}
//         <MemePickerSheet
//           visible={showMemePicker}
//           onSelectMeme={handleSendMeme}
//           onClose={() => setShowMemePicker(false)}
//         />

//         <View className="flex-row items-end gap-2 border-t border-gray-100 px-4 pt-2.5">
//           {isRecording ? (
//             <View className="flex-1 flex-row items-center justify-between bg-red-50 px-4 py-2.5 rounded-full">
//               <TouchableOpacity onPress={cancelRecording}>
//                 <Ionicons name="trash-outline" size={20} color="#EF4444" />
//               </TouchableOpacity>
//               <Text className="text-red-600 font-bold text-sm">
//                 Recording {formatDuration(recordingDuration)}
//               </Text>
//               <TouchableOpacity
//                 onPress={stopRecordingAndSend}
//                 className="bg-red-600 p-2 rounded-full"
//               >
//                 <Ionicons name="send" size={16} color="#FFFFFF" />
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <>
//               {/* Meme Picker Toggle Button (Left) */}
//               <TouchableOpacity
//                 onPress={() => {
//                   Keyboard.dismiss();
//                   setShowMemePicker((prev) => !prev);
//                 }}
//                 className={`p-2.5 rounded-full ${
//                   showMemePicker ? 'bg-blue-100' : 'bg-gray-100'
//                 }`}
//               >
//                 <Ionicons
//                   name="happy-outline"
//                   size={20}
//                   color={showMemePicker ? '#2563EB' : '#4B5563'}
//                 />
//               </TouchableOpacity>

//               {/* Text Input (Center) */}
//               <TextInput
//                 value={text}
//                 onChangeText={handleTextChange}
//                 onFocus={() => setShowMemePicker(false)}
//                 placeholder="Type a message..."
//                 placeholderTextColor="#9CA3AF"
//                 multiline
//                 className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 max-h-24"
//               />

//               {/* Attach & Send / Voice Note Buttons (Right) */}
//               <View className="flex-row items-center gap-1.5">
//                 <TouchableOpacity
//                   onPress={() => {
//                     setShowMemePicker(false);
//                     handlePickImage();
//                   }}
//                   className="p-2.5 bg-gray-100 rounded-full"
//                 >
//                   <Ionicons name="attach-outline" size={20} color="#4B5563" />
//                 </TouchableOpacity>

//                 {text.trim().length > 0 ? (
//                   <TouchableOpacity
//                     onPress={handleSend}
//                     className="p-2.5 bg-blue-600 rounded-full"
//                   >
//                     <Ionicons name="send" size={18} color="#FFFFFF" />
//                   </TouchableOpacity>
//                 ) : (
//                   <TouchableOpacity
//                     onPress={() => {
//                       setShowMemePicker(false);
//                       startRecording();
//                     }}
//                     className="p-2.5 bg-gray-100 rounded-full"
//                   >
//                     <Ionicons name="mic-outline" size={20} color="#4B5563" />
//                   </TouchableOpacity>
//                 )}
//               </View>
//             </>
//           )}
//         </View>
//       </Animated.View>
//     </View>
//   );
// }
