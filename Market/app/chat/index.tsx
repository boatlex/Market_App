import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMessages, Message } from '../../hooks/useMessages';
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

import {
  ChatAttachmentPreview,
  PendingAttachment,
} from '../../components/chat/ChatAttatchmentPreview';
import { ChatMessageBubble } from '../../components/chat/ChatMessageBubble';
import { ChatInputBar } from '../../components/chat/ChatInputBar';
import { MemePickerSheet, MemeItem } from '../../components/chat/MemePickerSheet';
import { capitalizeFirstLetter, isSameDay } from '../../lib/utils';
import { MessageActionsSheet } from '../../components/chat/MessageActionsSheet';
import { SwipeableMessageWrapper } from '../../components/chat/SwipeableMessageWrapper';

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
  const currentUserId = currentUser?._id || (currentUser as any)?.id;

  const [text, setText] = useState('');
  const [showMemePicker, setShowMemePicker] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const socketInstance = getSocket();
  const socket = socketInstance?.socket || socketInstance;

  const { messages, sendMessage, isSending, deleteMessage } = useMessages(
    targetUserId || ''
  );
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

  const isSelectedMessageMine = useMemo(() => {
    if (!selectedMessage || !currentUserId) return false;
    const msgSenderId =
      typeof selectedMessage.senderId === 'object'
        ? selectedMessage.senderId?._id || selectedMessage.senderId?.id
        : selectedMessage.senderId;
    return String(msgSenderId) === String(currentUserId);
  }, [selectedMessage, currentUserId]);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingEmitRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);

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
    if (!targetUserId) return;
    if (!text.trim() && !pendingAttachment) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit('stopTyping', { receiverId: targetUserId });
    isCurrentlyTypingEmitRef.current = false;

    const replyId = replyingTo?._id;

    if (pendingAttachment) {
      if (pendingAttachment.type === 'image') {
        sendMessage({
          type: 'image',
          fileUri: pendingAttachment.fileUri,
          fileName: pendingAttachment.fileName,
          fileType: pendingAttachment.fileType,
          content: text.trim() || undefined,
          replyTo: replyId,
        });
      } else if (pendingAttachment.type === 'voice') {
        sendMessage({
          type: 'voice',
          fileUri: pendingAttachment.fileUri,
          fileName: pendingAttachment.fileName,
          fileType: pendingAttachment.fileType,
          duration: pendingAttachment.duration,
          replyTo: replyId,
        });
      } else if (pendingAttachment.type === 'meme') {
        const { meme } = pendingAttachment;
        sendMessage({
          content: `[MEME]|${meme.emoji}|${meme.topText}|${meme.bottomText}|${meme.bgColor}|${meme.textColor}`,
          type: 'text',
          replyTo: replyId,
        });
      }

      setPendingAttachment(null);
      setReplyingTo(null);
      setText('');
      return;
    }

    sendMessage({
      content: text.trim(),
      type: 'text',
      replyTo: replyId,
    });
      setReplyingTo(null);
    setText('');
  };

  const handleSelectMemeForPreview = (meme: MemeItem) => {
    setShowMemePicker(false);
    setPendingAttachment({ type: 'meme', meme });
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
      setPendingAttachment({
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

  const stopRecordingForPreview = async () => {
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const status = audioRecorder.getStatus();
      const uri = audioRecorder.uri || (status as any)?.url;

      if (!uri) {
        alert('Recording URI was not generated.');
        return;
      }

      const isWeb = Platform.OS === 'web';
      setPendingAttachment({
        type: 'voice',
        fileUri: uri,
        fileName: `voice_note_${Date.now()}.${isWeb ? 'webm' : 'm4a'}`,
        fileType: isWeb ? 'audio/webm' : 'audio/m4a',
        duration: recordingDuration,
      });
    } catch (err) {
      alert('Error processing voice file.');
    }
  };

  const cancelRecording = async () => {
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch (err) {}
  };

  const handleScrollToMessage = (replyMessageId: string) => {
    const targetIndex = messages.findIndex((m) => m._id === replyMessageId);
    if (targetIndex !== -1) {
      flatListRef.current?.scrollToIndex({
        index: targetIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  return (
    <View
      style={[
        { flex: 1, paddingTop: insets.top },
        Platform.OS === 'web' ? ({ height: '100vh' } as any) : undefined,
      ]}
      className="bg-white md:bg-gray-50 overflow-hidden"
    >
      {/* Full-Width Top Bar */}
      <View className="w-full flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-10">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={handleBack} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOpenPeerProfile}
            className="flex-row items-center flex-1"
          >
            <View className="relative">
              {peerUser?.profilePicture ? (
                <Image
                  source={{ uri: peerUser.profilePicture }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                  <Text className="text-blue-700 font-bold text-base">
                    {peerFallbackInitial}
                  </Text>
                </View>
              )}
              {peerOnline && (
                <View className="w-3 h-3 rounded-full bg-green-500 border-2 border-white absolute bottom-0 right-0" />
              )}
            </View>

            <View className="ml-3 flex-1">
              <Text className="font-bold text-base text-gray-900" numberOfLines={1}>
                {peerName}
              </Text>
              <Text className="text-xs text-gray-500">
                {isPeerTyping ? 'Typing...' : peerOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setIsMenuOpen(true)} className="p-1 ml-2">
          <Ionicons name="ellipsis-vertical" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Centered Desktop Chat Column (Messages + Preview + Input Bar) */}
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateY }],
          paddingTop: keyboardHeight,
        }}
        className="w-full max-w-2xl self-center bg-white md:border-x md:border-gray-200 overflow-hidden"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || String(index)}
          showsVerticalScrollIndicator={true}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.5,
              });
            }, 100);
          }}
          renderItem={({ item, index }) => {
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showDateHeader =
              Boolean(item.createdAt) &&
              (!previousMessage || !isSameDay(previousMessage.createdAt, item.createdAt));

            const senderId =
              typeof item.senderId === 'object' ? item.senderId?._id : item.senderId;
            const isMe = String(senderId) === String(currentUserId);

            return (
              <SwipeableMessageWrapper message={item} onReply={setReplyingTo}>
                <ChatMessageBubble
                  item={item}
                  isMe={isMe}
                  showDateHeader={showDateHeader}
                  onLongPress={setSelectedMessage}
                  onPressReplyQuote={handleScrollToMessage}
                />
              </SwipeableMessageWrapper>
            );
          }}
          ListFooterComponent={
            isPeerTyping ? (
              <View className="px-4 py-1 items-start">
                <View className="bg-gray-100 px-3.5 py-2 rounded-2xl rounded-bl-sm">
                  <Text className="text-gray-500 text-xs italic">
                    {peerName} is typing...
                  </Text>
                </View>
              </View>
            ) : undefined
          }
        />

        {!isRecording && (
          <ChatAttachmentPreview
            attachment={pendingAttachment}
            onDiscard={() => setPendingAttachment(null)}
          />
        )}

        {/* Reply Preview Banner */}
        {replyingTo && (
          <View className="flex-row items-center bg-gray-100 px-4 py-2 border-t border-gray-200 border-l-4 border-l-blue-600">
            <View className="flex-1 mr-2">
              <Text className="text-xs font-semibold text-blue-600">
                Replying to{' '}
                {String(
                  typeof replyingTo.senderId === 'object'
                    ? (replyingTo.senderId as any)._id
                    : replyingTo.senderId
                ) === String(currentUserId)
                  ? 'Yourself'
                  : peerName}
              </Text>
              <Text numberOfLines={1} className="text-xs text-gray-600 mt-0.5">
                {replyingTo.messageType === 'image'
                  ? '📷 Photo'
                  : replyingTo.messageType === 'voice'
                  ? '🎤 Voice message'
                  : replyingTo.content?.startsWith('[MEME]|')
                  ? '🎭 Meme'
                  : replyingTo.content}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        <ChatInputBar
          text={text}
          onChangeText={handleTextChange}
          onSend={handleSend}
          onPickImage={handlePickImage}
          onOpenMemePicker={() => setShowMemePicker(true)}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          onStartRecording={startRecording}
          onStopRecording={stopRecordingForPreview}
          onCancelRecording={cancelRecording}
          pendingAttachment={pendingAttachment}
          isSending={isSending}
          bottomInset={insets.bottom}
        />
      </Animated.View>

      {/* Modals & Drawers */}
           {/* Modals & Drawers */}
      <MessageActionsSheet
        visible={Boolean(selectedMessage)}
        message={selectedMessage}
        isMe={isSelectedMessageMine}
        onClose={() => setSelectedMessage(null)}
        onDelete={(messageId) => deleteMessage(messageId)}
        onReply={(msg) => setReplyingTo(msg)}
      />

      <MemePickerSheet
        visible={showMemePicker}
        onClose={() => setShowMemePicker(false)}
        onSelectMeme={handleSelectMemeForPreview}
      />

      <ProfileMenuDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        unreadCount={unreadCount}
        isAdmin={isAdmin}
      />
    </View>
  );
}




// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Keyboard,
//   Animated,
//   Platform,
// } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { useMessages } from '../../hooks/useMessages';
// import { useRealTimeMessages } from '../../hooks/useRealTimeMessages';
// import { usePublicUserProfile } from '../../hooks/usePublicUserProfile';
// import { useOnlineUsers } from '../../hooks/useOnlineUsers';
// import { useAuth } from '../../contexts/authContext';
// import useNotifications from '../../hooks/useNotifications';
// import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';
// import { getSocket } from '../../sockets/sockets';
// import { Ionicons } from '@expo/vector-icons';
// import { Image } from 'expo-image';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import * as ImagePicker from 'expo-image-picker';
// import {
//   useAudioRecorder,
//   requestRecordingPermissionsAsync,
//   setAudioModeAsync,
//   RecordingPresets,
// } from 'expo-audio';

// import {
//   ChatAttachmentPreview,
//   PendingAttachment,
// } from '../../components/chat/ChatAttatchmentPreview';
// import { ChatMessageBubble } from '../../components/chat/ChatMessageBubble';
// import { ChatInputBar } from '../../components/chat/ChatInputBar';
// import { MemePickerSheet, MemeItem } from '../../components/chat/MemePickerSheet';
// import { capitalizeFirstLetter, isSameDay } from '../../lib/utils';
// import { MessageActionsSheet } from '../../components/chat/MessageActionsSheet';

// export default function ChatScreen() {
//   const params = useLocalSearchParams<{
//     userId?: string | string[];
//     id?: string | string[];
//   }>();
//   const rawUserId = params.userId ?? params.id;
//   const [targetUserId] = Array.isArray(rawUserId) ? rawUserId : [rawUserId];

//   const router = useRouter();
//   const { user: currentUser } = useAuth();
//   const { unreadCount } = useNotifications();
//   const isAdmin = currentUser?.role === 'admin';
//   const currentUserId = currentUser?._id || (currentUser as any)?.id;

//   const [text, setText] = useState('');
//   const [showMemePicker, setShowMemePicker] = useState(false);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [pendingAttachment, setPendingAttachment] =
//     useState<PendingAttachment | null>(null);
//   const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

//   const socketInstance = getSocket();
//   const socket = socketInstance?.socket || socketInstance;

//   const { messages, sendMessage, isSending, deleteMessage } = useMessages(
//     targetUserId || ''
//   );
//   const { isPeerTyping } = useRealTimeMessages(targetUserId || '');
//   const { data: peerData } = usePublicUserProfile(targetUserId);
//   const { isUserOnline } = useOnlineUsers();

//   const peerUser = peerData?.user;
//   const peerOnline = isUserOnline(targetUserId);

//   const peerName = useMemo(() => {
//     if (!peerUser) return 'Conversation';
//     return `${peerUser.firstName || ''} ${peerUser.lastName || ''}`.trim() || 'Member';
//   }, [peerUser]);

//   const peerFallbackInitial = useMemo(() => {
//     const first = peerUser?.firstName || peerUser?.lastName || 'U';
//     return capitalizeFirstLetter(first.charAt(0));
//   }, [peerUser]);

//   const isSelectedMessageMine = useMemo(() => {
//     if (!selectedMessage || !currentUserId) return false;
//     const msgSenderId =
//       typeof selectedMessage.senderId === 'object'
//         ? selectedMessage.senderId?._id || selectedMessage.senderId?.id
//         : selectedMessage.senderId;
//     return String(msgSenderId) === String(currentUserId);
//   }, [selectedMessage, currentUserId]);

//   const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const isCurrentlyTypingEmitRef = useRef(false);
//   const flatListRef = useRef<FlatList>(null);

//   const insets = useSafeAreaInsets();
//   const translateY = useRef(new Animated.Value(0)).current;
//   const [keyboardHeight, setKeyboardHeight] = useState(0);

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

//   const handleBack = () => {
//     const canGoBack =
//       Platform.OS === 'web'
//         ? typeof window !== 'undefined' && window.history.length > 1 && router.canGoBack()
//         : router.canGoBack();

//     if (canGoBack) {
//       router.back();
//     } else {
//       router.replace('/(tabs)/messages' as any);
//     }
//   };

//   const handleOpenPeerProfile = () => {
//     if (!targetUserId) return;
//     router.push({
//       pathname: '/user/[id]',
//       params: { id: String(targetUserId) },
//     });
//   };

//   const handleTextChange = (inputText: string) => {
//     setText(inputText);
//     if (!socket || !socket.connected || !targetUserId) return;

//     if (!isCurrentlyTypingEmitRef.current && inputText.trim().length > 0) {
//       socket.emit('typing', { receiverId: targetUserId });
//       isCurrentlyTypingEmitRef.current = true;
//     }

//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

//     if (inputText.trim().length === 0) {
//       socket.emit('stopTyping', { receiverId: targetUserId });
//       isCurrentlyTypingEmitRef.current = false;
//       return;
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       socket.emit('stopTyping', { receiverId: targetUserId });
//       isCurrentlyTypingEmitRef.current = false;
//     }, 2000);
//   };

//   const handleSend = () => {
//     if (!targetUserId) return;
//     if (!text.trim() && !pendingAttachment) return;

//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     socket?.emit('stopTyping', { receiverId: targetUserId });
//     isCurrentlyTypingEmitRef.current = false;

//     if (pendingAttachment) {
//       if (pendingAttachment.type === 'image') {
//         sendMessage({
//           type: 'image',
//           fileUri: pendingAttachment.fileUri,
//           fileName: pendingAttachment.fileName,
//           fileType: pendingAttachment.fileType,
//           content: text.trim() || undefined,
//         });
//       } else if (pendingAttachment.type === 'voice') {
//         sendMessage({
//           type: 'voice',
//           fileUri: pendingAttachment.fileUri,
//           fileName: pendingAttachment.fileName,
//           fileType: pendingAttachment.fileType,
//           duration: pendingAttachment.duration,
//         });
//       } else if (pendingAttachment.type === 'meme') {
//         const { meme } = pendingAttachment;
//         sendMessage({
//           content: `[MEME]|${meme.emoji}|${meme.topText}|${meme.bottomText}|${meme.bgColor}|${meme.textColor}`,
//           type: 'text',
//         });
//       }

//       setPendingAttachment(null);
//       setText('');
//       return;
//     }

//     sendMessage({ content: text.trim(), type: 'text' });
//     setText('');
//   };

//   const handleSelectMemeForPreview = (meme: MemeItem) => {
//     setShowMemePicker(false);
//     setPendingAttachment({ type: 'meme', meme });
//   };

//   const handlePickImage = async () => {
//     if (!targetUserId) {
//       alert('Recipient user ID is missing.');
//       return;
//     }

//     const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permissionResult.granted) {
//       alert('Storage access denied.');
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ['images'],
//       allowsEditing: true,
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets && result.assets.length > 0) {
//       const [targetAsset] = result.assets;
//       setPendingAttachment({
//         type: 'image',
//         fileUri: targetAsset.uri,
//         fileName: targetAsset.fileName || 'photo.jpg',
//         fileType: targetAsset.mimeType || 'image/jpeg',
//       });
//     }
//   };

//   const startRecording = async () => {
//     if (!targetUserId) return;
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

//   const stopRecordingForPreview = async () => {
//     setIsRecording(false);
//     if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

//     try {
//       await audioRecorder.stop();
//       await setAudioModeAsync({ allowsRecording: false });

//       const status = audioRecorder.getStatus();
//       const uri = audioRecorder.uri || (status as any)?.url;

//       if (!uri) {
//         alert('Recording URI was not generated.');
//         return;
//       }

//           const isWeb = Platform.OS === 'web';
//       setPendingAttachment({
//         type: 'voice',
//         fileUri: uri,
//         fileName: `voice_note_${Date.now()}.${isWeb ? 'webm' : 'm4a'}`,
//         fileType: isWeb ? 'audio/webm' : 'audio/m4a',
//         duration: recordingDuration,
//       });
//     } catch (err) {
//       alert('Error processing voice file.');
//     }
//   };

//   const cancelRecording = async () => {
//     setIsRecording(false);
//     if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
//     try {
//       await audioRecorder.stop();
//       await setAudioModeAsync({ allowsRecording: false });
//     } catch (err) {}
//   };

//   return (
//     <View
//       style={[
//         { flex: 1, paddingTop: insets.top },
//         Platform.OS === 'web' ? ({ height: '100vh' } as any) : undefined,
//       ]}
//       className="bg-white md:bg-gray-50 overflow-hidden"
//     >
//       {/* Full-Width Top Bar */}
//       <View className="w-full flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-10">
//         <View className="flex-row items-center flex-1">
//           <TouchableOpacity onPress={handleBack} className="mr-3 p-1">
//             <Ionicons name="arrow-back" size={24} color="#111827" />
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={handleOpenPeerProfile}
//             className="flex-row items-center flex-1"
//           >
//             <View className="relative">
//               {peerUser?.profilePicture ? (
//                 <Image
//                   source={{ uri: peerUser.profilePicture }}
//                   style={{ width: 40, height: 40, borderRadius: 20 }}
//                 />
//               ) : (
//                 <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
//                   <Text className="text-blue-700 font-bold text-base">
//                     {peerFallbackInitial}
//                   </Text>
//                 </View>
//               )}
//               {peerOnline && (
//                 <View className="w-3 h-3 rounded-full bg-green-500 border-2 border-white absolute bottom-0 right-0" />
//               )}
//             </View>

//             <View className="ml-3 flex-1">
//               <Text className="font-bold text-base text-gray-900" numberOfLines={1}>
//                 {peerName}
//               </Text>
//               <Text className="text-xs text-gray-500">
//                 {isPeerTyping ? 'Typing...' : peerOnline ? 'Online' : 'Offline'}
//               </Text>
//             </View>
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity onPress={() => setIsMenuOpen(true)} className="p-1 ml-2">
//           <Ionicons name="ellipsis-vertical" size={22} color="#111827" />
//         </TouchableOpacity>
//       </View>

//       {/* Centered Desktop Chat Column (Messages + Preview + Input Bar) */}
//       <Animated.View
//         style={{
//           flex: 1,
//           transform: [{ translateY }],
//           paddingTop: keyboardHeight,
//         }}
//         className="w-full max-w-2xl self-center bg-white md:border-x md:border-gray-200 overflow-hidden"
//       >
//         <FlatList
//           ref={flatListRef}
//           data={messages}
//           keyExtractor={(item, index) => item._id || String(index)}
//           showsVerticalScrollIndicator={true}
//           style={{ flex: 1 }}
//           contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
//           onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
//           onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
//           renderItem={({ item, index }) => {
//             const previousMessage = index > 0 ? messages[index - 1] : null;
//             const showDateHeader =
//               Boolean(item.createdAt) &&
//               (!previousMessage || !isSameDay(previousMessage.createdAt, item.createdAt));

//             const senderId =
//               typeof item.senderId === 'object' ? item.senderId?._id : item.senderId;
//             const isMe = String(senderId) === String(currentUserId);

//             return (
//               <ChatMessageBubble
//                 item={item}
//                 isMe={isMe}
//                 showDateHeader={showDateHeader}
//                 onLongPress={setSelectedMessage}
//               />
//             );
//           }}
//           ListFooterComponent={
//             isPeerTyping ? (
//               <View className="px-4 py-1 items-start">
//                 <View className="bg-gray-100 px-3.5 py-2 rounded-2xl rounded-bl-sm">
//                   <Text className="text-gray-500 text-xs italic">
//                     {peerName} is typing...
//                   </Text>
//                 </View>
//               </View>
//             ) : undefined
//           }
//         />

//         {!isRecording && (
//           <ChatAttachmentPreview
//             attachment={pendingAttachment}
//             onDiscard={() => setPendingAttachment(null)}
//           />
//         )}

//         <ChatInputBar
//           text={text}
//           onChangeText={handleTextChange}
//           onSend={handleSend}
//           onPickImage={handlePickImage}
//           onOpenMemePicker={() => setShowMemePicker(true)}
//           isRecording={isRecording}
//           recordingDuration={recordingDuration}
//           onStartRecording={startRecording}
//           onStopRecording={stopRecordingForPreview}
//           onCancelRecording={cancelRecording}
//           pendingAttachment={pendingAttachment}
//           isSending={isSending}
//           bottomInset={insets.bottom}
//         />
//       </Animated.View>

//       {/* Modals & Drawers */}
//       <MessageActionsSheet
//         visible={Boolean(selectedMessage)}
//         message={selectedMessage}
//         isMe={isSelectedMessageMine}
//         onClose={() => setSelectedMessage(null)}
//         onDelete={(messageId) => deleteMessage(messageId)}
//       />

//       <MemePickerSheet
//         visible={showMemePicker}
//         onClose={() => setShowMemePicker(false)}
//         onSelectMeme={handleSelectMemeForPreview}
//       />

//       <ProfileMenuDrawer
//         visible={isMenuOpen}
//         onClose={() => setIsMenuOpen(false)}
//         unreadCount={unreadCount}
//         isAdmin={isAdmin}
//       />
//     </View>
//   );
// }