import io from 'socket.io-client';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../lib/api";

let socket = null;

export const connectSocket = async (explicitToken = null) => {
    const token = explicitToken || await AsyncStorage.getItem("manual_token");
    
    
    if (!token) {
        console.warn('Socket connection aborted: No token available.');
        return null; 
    }
  
    if (socket && socket.connected) {
        socket.auth = { token };
        return socket;
    }

    if (socket && !socket.connected) {
        socket.auth = { token }; 
        socket.connect();
        return socket;
    }
    socket = io("http://10.56.237.151:3000", { 
    auth: { token },
    transports: ['websocket', 'polling'], 
    autoConnect: false,        
});


    socket.on('connect', () => {
        console.log('Socket Connected Successfully ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('User disconnected from Socket. Reason:', reason);
        if (reason === "io server disconnect") {
            socket.connect();
        }
    });

    socket.on('connect_error', (error) => {
        console.error('Socket Connection Error:', error.message);
    });

    socket.connect();
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.removeAllListeners(); 
        socket.disconnect();
        socket = null;
        console.log('Socket completely cleared and nulled.');
    }
};
