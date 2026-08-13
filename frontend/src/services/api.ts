const API_URL = '/api';

export const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token === 'undefined' || token === 'null' ? null : token;
};
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

interface FetchOptions extends RequestInit {
  data?: any;
}

export const api = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { data, headers: customHeaders, method: explicitMethod, ...customConfig } = options;
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...customHeaders,
  };

  const method = explicitMethod || (data ? 'POST' : 'GET');

  const config: RequestInit = {
    method,
    body: data ? JSON.stringify(data) : undefined,
    headers,
    ...customConfig,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // Parse response first to get the error message if any
  let result;
  try {
    result = await response.json();
  } catch (e) {
    result = { message: 'An error occurred' };
  }
  
  if (response.status === 401) {
    removeAuthToken();
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
    throw new Error(result.message || 'Unauthorized');
  }
  
  if (!response.ok) {
    throw new Error(result.message || 'API request failed');
  }

  return result;
};
