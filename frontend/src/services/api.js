import axios from 'axios';

const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      details: error.response?.data?.details
    });

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Auth
export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (name, email, password) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

// Contacts
export const getContacts = async (params) => {
  const { data } = await api.get('/contacts', { params });
  return data;
};

export const createContact = async (contact) => {
  const { data } = await api.post('/contacts', contact);
  return data;
};

export const updateContact = async (id, contact) => {
  const { data } = await api.put(`/contacts/${id}`, contact);
  return data;
};

export const deleteContact = async (id) => {
  const { data } = await api.delete(`/contacts/${id}`);
  return data;
};

export const importContacts = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/contacts/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const bulkContactAction = async (action, contactIds, data) => {
  const response = await api.post('/contacts/bulk-action', { action, contactIds, data });
  return response.data;
};

// Messages
export const getMessages = async (params) => {
  const { data } = await api.get('/messages', { params });
  return data;
};

export const sendMessage = async (message) => {
  try {
    console.log('Sending message:', message);
    const { data } = await api.post('/messages/send', message);
    console.log('Message sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Send message error details:', {
      status: error.response?.status,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
      message: error.message
    });
    throw error;
  }
};

export const sendBulkMessages = async (message) => {
  const { data } = await api.post('/messages/send-bulk', message);
  return data;
};

// Templates
export const getTemplates = async () => {
  const { data } = await api.get('/templates');
  return data;
};

export const createTemplate = async (template) => {
  const { data } = await api.post('/templates', template);
  return data;
};

export const updateTemplate = async (id, template) => {
  const { data } = await api.put(`/templates/${id}`, template);
  return data;
};

export const deleteTemplate = async (id) => {
  const { data } = await api.delete(`/templates/${id}`);
  return data;
};

// Campaigns
export const getCampaigns = async () => {
  const { data } = await api.get('/campaigns');
  return data;
};

export const createCampaign = async (campaign) => {
  const { data } = await api.post('/campaigns', campaign);
  return data;
};

export const updateCampaign = async (id, campaign) => {
  const { data } = await api.put(`/campaigns/${id}`, campaign);
  return data;
};

export const deleteCampaign = async (id) => {
  const { data } = await api.delete(`/campaigns/${id}`);
  return data;
};

// Chatbots
export const getChatbots = async () => {
  const { data } = await api.get('/chatbot');
  return data;
};

export const createChatbot = async (chatbot) => {
  const { data } = await api.post('/chatbot', chatbot);
  return data;
};

export const updateChatbot = async (id, chatbot) => {
  const { data } = await api.put(`/chatbot/${id}`, chatbot);
  return data;
};

export const deleteChatbot = async (id) => {
  const { data } = await api.delete(`/chatbot/${id}`);
  return data;
};

// WhatsApp Numbers
export const getWhatsAppNumbers = async () => {
  const { data } = await api.get('/numbers');
  return data;
};

export const addWhatsAppNumber = async (number) => {
  const { data } = await api.post('/numbers', number);
  return data;
};

export const updateWhatsAppNumber = async (id, number) => {
  const { data } = await api.put(`/numbers/${id}`, number);
  return data;
};

export const deleteWhatsAppNumber = async (id) => {
  const { data } = await api.delete(`/numbers/${id}`);
  return data;
};

// Analytics
export const getDashboardAnalytics = async (params) => {
  const { data } = await api.get('/analytics/dashboard', { params });
  return data;
};

export const exportData = async (type, startDate, endDate) => {
  const { data } = await api.get('/analytics/export', {
    params: { type, startDate, endDate }
  });
  return data;
};

// Social Media
export const getSocialPosts = async () => {
  const { data } = await api.get('/social');
  return data;
};

export const createSocialPost = async (post) => {
  const { data } = await api.post('/social', post);
  return data;
};

export const deleteSocialPost = async (id) => {
  const { data } = await api.delete(`/social/${id}`);
  return data;
};

export default api;