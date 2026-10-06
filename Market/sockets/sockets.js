import io from 'socket.io-client'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../lib/api"

let socket = null;

export const connectSocket = async () => {
    const token = await AsyncStorage.getItem('token')
     
    if (!token) {
        throw new Error('User not logged in: Please login first')
    }
  
    if (socket && socket.connected) {
        return socket;
    }

    if (socket && !socket.connected) {
        socket.auth = { token }; 
        socket.connect();
        return socket;
    }

    // Create a new socket instance
    socket = io(API_URL, {
        auth: { token },
        transports: ['websocket'], 
        autoConnect: false,        
    });

    socket.on('connect', () => {
        console.log('Socket Connected Successfully ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('User disconnected from Socket. Reason:', reason);
        // If server disconnected us forcefully, try reconnecting manually if needed
        if (reason === "io server disconnect") {
            socket.connect();
        }
    });

    socket.on('connect_error', (error) => {
        console.error('Socket Connection Error:', error.message);
    });

    socket.connect();

    return socket;
}

export const getSocket = () => {
    return socket
}

export const disconnectSocket = () => {
    if (socket) {
        socket.removeAllListeners(); // 🚀 Prevent memory leaks by wiping event listeners
        socket.disconnect();
        socket = null;
        console.log('Socket completely cleared and nulled.');
    }
}
