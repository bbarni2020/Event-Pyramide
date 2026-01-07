import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authService = {
  checkStatus: () => api.get('/auth/check-status'),
  logout: () => api.post('/auth/logout'),
  requestOTP: (username) => api.post('/auth/request-otp', { username: username.toLowerCase() }),
  verifyOTP: (username, otp) => api.post('/auth/verify-otp', { username: username.toLowerCase(), otp }),
  setAttendance: (attending) => api.post('/auth/set-attendance', { attending })
};

export const invitationService = {
  getMyInvitations: () => api.get('/api/invitations'),
  createInvitation: (data) => api.post('/api/invitations', data)
};

export const eventService = {
  getConfig: () => api.get('/api/admin/config')
};

export const ticketService = {
  getMyTicket: () => api.get('/api/tickets/my-ticket'),
  generateTicket: () => api.post('/api/tickets/generate')
};

export const adminService = {
  getUsers: () => api.get('/api/admin/users'),
  getInvitations: () => api.get('/api/admin/invitations'),
  getTickets: () => api.get('/api/admin/tickets'),
  getConfig: () => api.get('/api/admin/config'),
  updateConfig: (data) => api.put('/api/admin/config', data),
  sendUpdate: (data) => api.post('/api/bot/send-update', data),
  broadcast: (data) => api.post('/api/bot/broadcast', data)
};

export default api;
