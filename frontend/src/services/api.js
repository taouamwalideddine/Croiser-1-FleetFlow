import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

export const truckAPI = {
  list: async () => {
    const response = await api.get('/trucks');
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/trucks', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/trucks/${id}`, payload);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/trucks/${id}`);
    return response.data;
  },
  updateTracking: async (id, payload) => {
    const response = await api.patch(`/trucks/${id}/tracking`, payload);
    return response.data;
  }
};

export const trailerAPI = {
  list: async () => {
    const response = await api.get('/trailers');
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/trailers', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/trailers/${id}`, payload);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/trailers/${id}`);
    return response.data;
  },
  updateTracking: async (id, payload) => {
    const response = await api.patch(`/trailers/${id}/tracking`, payload);
    return response.data;
  }
};

export const journeyAPI = {
  list: async () => {
    const response = await api.get('/journeys');
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/journeys', payload);
    return response.data;
  },
  updateStatus: async (id, status, note = '') => {
    const response = await api.patch(`/journeys/${id}/status`, { status, note });
    return response.data;
  },
  updateTracking: async (id, payload) => {
    const response = await api.patch(`/journeys/${id}/tracking`, payload);
    return response.data;
  },
  // Get available drivers for assignment
  getAvailableDrivers: async () => {
    const response = await api.get('/users/drivers');
    return response.data;
  },
  // Get available trucks for assignment
  getAvailableTrucks: async () => {
    const response = await api.get('/trucks/available');
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/journeys/${id}`);
    return response.data;
  }
};

export const tireAPI = {
  list: async (status) => {
    const response = await api.get('/tires', { params: status ? { status } : {} });
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/tires', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/tires/${id}`, payload);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/tires/${id}`);
    return response.data;
  },
  assign: async (id, payload) => {
    const response = await api.patch(`/tires/${id}/assign`, payload);
    return response.data;
  },
  unassign: async (id) => {
    const response = await api.patch(`/tires/${id}/unassign`);
    return response.data;
  },
  updateWear: async (id, payload) => {
    const response = await api.patch(`/tires/${id}/wear`, payload);
    return response.data;
  }
};

export const maintenanceRuleAPI = {
  list: async () => {
    const response = await api.get('/maintenance-rules');
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/maintenance-rules', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/maintenance-rules/${id}`, payload);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/maintenance-rules/${id}`);
    return response.data;
  },
  upcoming: async () => {
    const response = await api.get('/maintenance-rules/upcoming/all');
    return response.data;
  }
};

export const reportsAPI = {
  summary: async () => {
    const response = await api.get('/reports/summary');
    return response.data;
  }
};

export default api;


