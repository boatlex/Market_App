import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../sockets/sockets';
import { Message } from '../types';

export const useRealTimeMessages = (activeChatUserId: string) => {
  const queryClient = useQueryClient();
  const { socket } = getSocket();
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  useEffect(() => {
    if (!socket) return;

    
    socket.on('newMessage', (newMessage: Message) => {
      const isFromActiveChat = newMessage.senderId === activeChatUserId;

      if (isFromActiveChat) {
        queryClient.setQueryData<Message[]>(['messages', activeChatUserId], (oldMessages) => {
          if (!oldMessages) return [newMessage];
          const messageExists = oldMessages.some((msg) => msg._id === newMessage._id);
          if (messageExists) return oldMessages;
          return [...oldMessages, newMessage];
        });
        setIsPeerTyping(false);
      }
    });

    
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
