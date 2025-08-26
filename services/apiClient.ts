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
    return 'https://default-api.com'; // fallback
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
    },
  });

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