import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../sockets/sockets';
import { Message } from '../types';

export const useRealTimeMessages = (activeChatUserId: string) => {
  const queryClient = useQueryClient();
  const { socket } = getSocket();
  const [isPeerTyping, setIsPeerTyping] = useState(false); // 🚀 Tracks if the other user is typing

  useEffect(() => {
    if (!socket) return;

    // 1. Listen for new incoming messages
    socket.on('newMessage', (newMessage: Message) => {
      const isFromActiveChat = newMessage.senderId === activeChatUserId;

      if (isFromActiveChat) {
        queryClient.setQueryData<Message[]>(['messages', activeChatUserId], (oldMessages) => {
          if (!oldMessages) return [newMessage];
          const messageExists = oldMessages.some((msg) => msg._id === newMessage._id);
          if (messageExists) return oldMessages;
          return [...oldMessages, newMessage];
        });
        setIsPeerTyping(false); // Force turn off typing status when a message drops in
      }
    });

    // 2. Listen for typing events from this specific peer
    socket.on('displayTyping', (data: { senderId: string }) => {
      if (String(data.senderId) === String(activeChatUserId)) {
        setIsPeerTyping(true);
      }
    });

    // 3. Listen for stopTyping events from this specific peer
    socket.on('hideTyping', (data: { senderId: string }) => {
      if (String(data.senderId) === String(activeChatUserId)) {
        setIsPeerTyping(false);
      }
    });

    return () => {
      socket.off('newMessage');
      socket.off('displayTyping');
      socket.off('hideTyping');
    };
  }, [socket, activeChatUserId, queryClient]);

  return { isPeerTyping };
};
