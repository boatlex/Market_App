import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_URL = "http://10.251.38.151:3000/api"; 

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

let getClerkTokenInstance: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (getterFn: () => Promise<string | null>) => {
  getClerkTokenInstance = getterFn;
};

api.interceptors.request.use(
  async (config) => {
    try {
      let token = await AsyncStorage.getItem("manual_token");
      if (!token && getClerkTokenInstance) {
        token = await getClerkTokenInstance();
      }

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
