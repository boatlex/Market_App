import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../sockets/sockets';
import { Message } from '../types';

export const useRealTimeMessages = (activeChatUserId: string) => {
  const queryClient = useQueryClient();
  const socketInstance = getSocket();
  const socket = socketInstance?.socket || socketInstance;

  const [isPeerTyping, setIsPeerTyping] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage: Message) => {
      const incomingSenderId =
        typeof newMessage.senderId === 'object'
          ? String((newMessage.senderId as any)._id)
          : String(newMessage.senderId);

      const isFromActiveChat = incomingSenderId === String(activeChatUserId);

      if (isFromActiveChat) {
        queryClient.setQueryData<Message[]>(['messages', activeChatUserId], (oldMessages) => {
          if (!oldMessages) return [newMessage];

          const messageExists = oldMessages.some((msg) => msg._id === newMessage._id);
          if (messageExists) return oldMessages;

          return [...oldMessages, newMessage];
        });

        setIsPeerTyping(false);
      }

      // Keep the main inbox/conversations list preview up to date
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

     const handleMessagesRead = (data: { readerId: string }) => {
      if (String(data.readerId) === String(activeChatUserId)) {
        queryClient.setQueryData<Message[]>(['messages', activeChatUserId], (oldMessages) =>
          oldMessages
            ? oldMessages.map((msg) => ({ ...msg, read: true }))
            : []
        );
      }
    };

   
    const handleDisplayTyping = (data: { senderId: string }) => {
      if (String(data.senderId) === String(activeChatUserId)) {
        setIsPeerTyping(true);
      }
    };

    const handleHideTyping = (data: { senderId: string }) => {
      if (String(data.senderId) === String(activeChatUserId)) {
        setIsPeerTyping(false);
      }
    };

        const handleMessageDeleted = (data: { messageId: string; senderId: string }) => {
      if (String(data.senderId) === String(activeChatUserId)) {
        queryClient.setQueryData<Message[]>(['messages', activeChatUserId], (oldMessages) =>
          oldMessages
            ? oldMessages.filter((msg) => String(msg._id) !== String(data.messageId))
            : []
        );
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    };

   

    socket.on('messagesRead', handleMessagesRead);
    socket.on('newMessage', handleNewMessage);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('displayTyping', handleDisplayTyping);
    socket.on('hideTyping', handleHideTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('displayTyping', handleDisplayTyping);
      socket.off('hideTyping', handleHideTyping);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, activeChatUserId, queryClient]);

  return { isPeerTyping };
};
