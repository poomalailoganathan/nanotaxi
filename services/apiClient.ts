import axios, { AxiosInstance } from 'axios';

let api: AxiosInstance | null = null;

// Dynamically fetch the backend base URL from Vercel
export const fetchBaseURL = async (): Promise<string> => {
  try {
    const response = await axios.get('https://server-url-chi.vercel.app/url');
    console.log('✅ Fetched dynamic URL:', response.data?.base_url);
    return response.data?.base_url || 'https://4c937840d5fd.ngrok-free.app/'; // fallback
  } catch (error) {
    console.warn('❌ Failed to fetch dynamic URL:', error);
    return 'https://api.namma-taxi.com'; // fallback to your API domain
  }
};

// Initialize the API client only once
export const getApiClient = async (): Promise<AxiosInstance> => {
  if (api) return api;

  const baseURL = await fetchBaseURL();

  api = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Add request interceptor for logging
  api.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  api.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error(`❌ API Response Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
      return Promise.reject(error);
    }
  );

  return api;
};

// Optional wrapper helpers:
export const apiGet = async (endpoint: string, config = {}) => {
  const client = await getApiClient();
  return client.get(endpoint, config);
};

export const apiPost = async (endpoint: string, data = {}, config = {}) => {
  const client = await getApiClient();
  return client.post(endpoint, data, config);
};

export const apiPut = async (endpoint: string, data = {}, config = {}) => {
  const client = await getApiClient();
  return client.put(endpoint, data, config);
};