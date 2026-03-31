import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

const API = axios.create({
  baseURL: "http://192.168.1.14:8000", // pastikan IP backend
  timeout: 15000,
});

async function getToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem("access_token");
  } else {
    return await AsyncStorage.getItem("access_token");
  }
}

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;