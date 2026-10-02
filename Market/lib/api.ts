import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Update this with your machine's local IP when testing on physical devices or Android emulators (e.g., 'http://192.168.1.X:3000/api')
const API_URL = "http://localhost:3000/api";

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Holds the reference to Clerk's getToken function passed from the UI layer
let getClerkTokenInstance: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (getterFn: () => Promise<string | null>) => {
  getClerkTokenInstance = getterFn;
};

/**
 * Global Request Interceptor
 * Runs outside of a hook context so it attache exactly ONCE globally.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Try pulling the manual auth token first
      let token = await AsyncStorage.getItem("manual_token");

      // 2. Fallback to Clerk if no manual token exists
      if (!token && getClerkTokenInstance) {
        token = await getClerkTokenInstance();
      }

      // 3. Attach the active token to your protected route middleware
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to intercept and inject auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
