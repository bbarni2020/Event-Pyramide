import axios from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  config => {
    delete config.headers['x-xsrf-token'];
    return config;
  }
);

api.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

export const authService = {
  checkStatus: () => api.get('/auth/check-status'),
  logout: () => api.post('/auth/logout'),
  requestOTP: (username) => api.post('/auth/request-otp', { username: username.toLowerCase() }),
  verifyOTP: (username, otp) => api.post('/auth/verify-otp', { username: username.toLowerCase(), otp }),
  setAttendance: (attending) => api.post('/auth/set-attendance', { attending })
};

export const invitationService = {
  getMyInvitations: () => api.get('/api/invitations'),
  createInvitation: (data) => api.post('/api/invitations', data),
  deleteInvitation: (id) => api.delete(`/api/invitations/${id}`)
};

export const eventService = {
  getConfig: () => api.get('/api/admin/config'),
  getInfo: () => api.get('/api/event/info')
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
  updateUserRole: (userId, role) => api.put(`/api/admin/users/${userId}/role`, { role }),
  getSalaries: () => api.get('/api/admin/salaries'),
  updateSalary: (role, salary, currency) => api.put(`/api/admin/salaries/${role}`, { salary, currency }),
  sendUpdate: (data) => api.post('/api/bot/send-update', data),
  broadcast: (data) => api.post('/api/bot/broadcast', data)
};

export default api;
