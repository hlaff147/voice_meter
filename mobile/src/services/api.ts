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

// Request interceptor logging
api.interceptors.request.use(
  async (config) => {
    console.log('🌐 API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data instanceof FormData ? 'FormData' : config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    // Handle errors globally
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
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

  analyzeSpeech: async (audioUri: string, category: string, expectedText?: string, fileInfo?: { name: string, type: string }) => {
    console.log('🎤 analyzeSpeech called:', { audioUri, category, expectedText: expectedText?.substring(0, 50), fileInfo });
    
    try {
      // Fetch the audio file as a blob
      console.log('📥 Fetching audio file from URI...');
      const response = await fetch(audioUri);
      const blob = await response.blob();
      console.log('📦 Blob created:', { size: blob.size, type: blob.type });
      
      const formData = new FormData();
      
      // Create a proper File object from the blob
      const fileName = fileInfo?.name || 'recording.m4a';
      const fileType = fileInfo?.type || blob.type || 'audio/m4a';
      
      const file = new File([blob], fileName, { type: fileType });
      console.log('📁 File object created:', { name: file.name, size: file.size, type: file.type });
      
      formData.append('audio_file', file);
      formData.append('category', category);
      
      // Add expected text if provided
      if (expectedText && expectedText.trim()) {
        formData.append('expected_text', expectedText.trim());
        console.log('📝 Expected text added to form data');
      }
      
      console.log('📤 Sending request to /api/v1/speech/analyze');
      console.log('FormData entries:');
      // @ts-ignore
      for (let pair of formData.entries()) {
        const value = pair[1];
        if (typeof value === 'string') {
          console.log('  ', pair[0], ':', value.substring(0, 50) + (value.length > 50 ? '...' : ''));
        } else {
          console.log('  ', pair[0], ':', pair[1]);
        }
      }
      
      const analysisResponse = await api.post('/api/v1/speech/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for audio processing with Whisper
      });
      
      console.log('✅ Analysis response:', analysisResponse.data);
      return analysisResponse.data;
    } catch (error: any) {
      console.error('❌ Error in analyzeSpeech:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  getHistory: async () => {
    console.log('📜 getHistory called');
    try {
      const response = await api.get('/api/v1/speech/history');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error in getHistory:', error);
      throw error;
    }
  },
};

export default api;
