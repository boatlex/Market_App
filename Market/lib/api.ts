
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  // Use your computer's local IP for emulator testing, or your live Sevalla URL
  baseURL: "http://192.168.1", 
  timeout: 10000,
});

// Create a globally accessible variable or state to hold the Clerk token getter
let getClerkTokenInstance = null;
export const setClerkTokenGetter = (getterFn) => {
  getClerkTokenInstance = getterFn;
};

// This function automatically figures out which token to use
API.interceptors.request.use(
  async (config) => {
    let token = null;

    // 1. Check if there is a manual login token saved in local storage
    token = await AsyncStorage.getItem("manual_token");

    // 2. If no manual token exists, try to grab the token from Clerk
    if (!token && getClerkTokenInstance) {
      token = await getClerkTokenInstance();
    }

    // 3. If a token is found (either manual or Clerk), inject it into the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;




// import axios from "axios";
// import { useAuth } from "@clerk/expo";
// import { useEffect } from "react";

// const API_URL = "http://localhost:3000/api";
// //const API_URL = "http://localhost:3000/api";
// const api = axios.create({
//     baseURL: API_URL,
//     headers: {
//         "Content-Type": "application/json"
//     }
// });

// export const useApi = () => {
//     const { getToken } = useAuth();
    
//     useEffect(() => {
//         const interceptor = api.interceptors.request.use(async (config) => {
//             try {
//                 const token = await getToken(); 
//                 if (token) {
//                     config.headers.Authorization = `Bearer ${token}`;
//                 }
//             } catch (error) {
//                 console.error("Failed to fetch Clerk token:", error);
//             }
//             return config;
//         }, (error) => {
//             return Promise.reject(error);
//         });
//         return () => {
//             api.interceptors.request.eject(interceptor);
//         };
//     }, [getToken]);
//     return api;
// };
