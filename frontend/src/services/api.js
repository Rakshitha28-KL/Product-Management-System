import axios from 'axios';

// Set base URL dynamically based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Automatically attach Bearer token to all outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global 401 unauthorized / expired token
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth session
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Helper to format API errors consistently for the UI
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status code (4xx, 5xx)
    const data = error.response.data;
    const message = data?.message || 'An error occurred while processing your request';
    const errors = data?.errors || [];
    return {
      message,
      errors,
      status: error.response.status,
    };
  } else if (error.request) {
    // Request made but no response received (network down, server offline)
    return {
      message: 'Unable to connect to the backend server. Please ensure the backend is running.',
      errors: [],
      status: 0,
    };
  } else {
    // Something else triggered the error
    return {
      message: error.message || 'An unexpected error occurred.',
      errors: [],
      status: 0,
    };
  }
};

/* ==========================================================================
   AUTHENTICATION API SERVICES
   ========================================================================== */

export const registerApi = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const loginApi = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const logoutApi = async () => {
  try {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  } catch (error) {
    return { success: true };
  }
};

export const getMeApi = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/* ==========================================================================
   PRODUCT & INVENTORY API SERVICES
   ========================================================================== */

export const getProducts = async (params = {}) => {
  try {
    const response = await apiClient.get('/products', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getProductStats = async () => {
  try {
    const response = await apiClient.get('/products/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getCategories = async () => {
  try {
    const response = await apiClient.get('/products/categories');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getProductById = async (id) => {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await apiClient.post('/products', productData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/* ==========================================================================
   ADVANCED STOCK MANAGEMENT API SERVICES
   ========================================================================== */

/**
 * Dedicated stock adjustment endpoint
 * @param {string} id - Product ID
 * @param {Object} stockData - { newQuantity, reason, changeType, note }
 */
export const updateProductStock = async (id, stockData) => {
  try {
    const response = await apiClient.post(`/products/${id}/stock`, stockData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch product stock movement history
 * @param {string} id - Product ID
 */
export const getProductStockHistory = async (id) => {
  try {
    const response = await apiClient.get(`/products/${id}/stock-history`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/* ==========================================================================
   AUDIT LOG API SERVICES (ADMIN ONLY)
   ========================================================================== */

export const getAuditLogs = async (params = {}) => {
  try {
    const response = await apiClient.get('/audit-logs', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAuditLogById = async (id) => {
  try {
    const response = await apiClient.get(`/audit-logs/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAuditLogStats = async () => {
  try {
    const response = await apiClient.get('/audit-logs/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export default apiClient;
