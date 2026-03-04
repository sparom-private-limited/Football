import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "./env";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR - Attach Token + Debug
// ============================================
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    // if (token) {
    //   console.log('🔑 Token preview:', token.substring(0, 30) + '...');
    // } else {
    //   console.warn('⚠️ NO TOKEN IN STORAGE');
    // }

    // If we are sending FormData, Force correct header
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No Authorization header - request will fail if auth required');
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);


// RESPONSE INTERCEPTOR - Debug Errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const message = error.response?.data?.message;

    console.error('❌ API Error Details:');
    console.error('  URL:', url);
    console.error('  Status:', status);
    console.error('  Message:', message);
    console.error('  Full response:', JSON.stringify(error.response?.data, null, 2));

    // Specific handling for common errors
    if (status === 403) {
      console.error('🚫 403 FORBIDDEN');
      console.error('  Reason: Server rejected request');
      console.error('  Common causes:');
      console.error('    1. User role mismatch (expected "team")');
      console.error('    2. Token is valid but user lacks permission');
      console.error('    3. User not associated with a team');
      
      // Check if token exists
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      console.error('  Debug Info:');
      console.error('    - Token exists:', !!token);
      console.error('    - User data:', user);
    }

    if (status === 401) {
      console.error('🔒 401 UNAUTHORIZED');
      console.error('  Reason: Invalid or expired token');
      console.error('  Action: User should re-login');
    }

    if (status === 404) {
      console.error('🔍 404 NOT FOUND');
      console.error('  Reason:', message || 'Resource not found');
    }

    return Promise.reject(error);
  }
);

export default API;