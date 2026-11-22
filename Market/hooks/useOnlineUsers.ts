import { useEffect, useState } from 'react';
import { getSocket } from '../sockets/sockets';

export const useOnlineUsers = () => {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    let attachedSocket: any = null;

    const handleGetOnlineUsers = (userIds: string[]) => {
      if (!isMounted || !Array.isArray(userIds)) return;
      setOnlineUserIds(new Set(userIds.map((id) => String(id))));
    };

    const handleConnect = () => {
      attachedSocket?.emit('requestOnlineUsers');
    };

    const attachListeners = () => {
      const socket = getSocket();
      if (!socket || attachedSocket === socket) return Boolean(socket);

      attachedSocket = socket;
      socket.on('getOnlineUsers', handleGetOnlineUsers);
      socket.on('connect', handleConnect);

      if (socket.connected) {
        socket.emit('requestOnlineUsers');
      }

      return true;
    };

    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (!attachListeners()) {
      intervalId = setInterval(() => {
        if (attachListeners() && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 500);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (attachedSocket) {
        attachedSocket.off('getOnlineUsers', handleGetOnlineUsers);
        attachedSocket.off('connect', handleConnect);
      }
    };
  }, []);

  const isUserOnline = (userId?: string | null) => {
    if (!userId) return false;
    return onlineUserIds.has(String(userId));
  };

  return { onlineUserIds, isUserOnline };
};
