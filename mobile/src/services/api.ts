import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    // You can add auth token here
    // const token = await AsyncStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle errors globally
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
  
  getCategories: async () => {
    const response = await api.get('/api/v1/speech/categories');
    return response.data;
  },

  analyzeSpeech: async (audioUri: string, category: string) => {
    const formData = new FormData();
    
    // Get file extension from URI
    const uriParts = audioUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // Create file object for form data
    const file: any = {
      uri: audioUri,
      type: `audio/${fileType}`,
      name: `recording.${fileType}`,
    };
    
    formData.append('audio_file', file);
    formData.append('category', category);
    
    const response = await api.post('/api/v1/speech/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for audio processing
    });
    
    return response.data;
  },
};

export default api;
