import axios from 'axios';

const API_URL = 'http://192.168.1.20:5000/api'; // Updated with your local IP for mobile connection

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },
};

export const adminService = {
  getStaff: async () => {
    const response = await api.get('/staff');
    return response.data;
  },
  getSites: async () => {
    const response = await api.get('/sites');
    return response.data;
  },
  createSite: async (siteData: any) => {
    const response = await api.post('/sites', siteData);
    return response.data;
  },
  deleteSite: async (id: string) => {
    const response = await api.delete(`/sites/${id}`);
    return response.data;
  },
  addStaff: async (staffData: any) => {
    const response = await api.post('/staff', staffData);
    return response.data;
  },
  deleteStaff: async (id: string) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
  },
  allocateSupervisor: async (supervisorId: string, siteId: string) => {
    const response = await api.post('/allocations', { supervisorId, siteId });
    return response.data;
  },
  getLeads: async () => {
    const response = await api.get('/leads');
    return response.data;
  },
  createLead: async (leadData: any) => {
    const response = await api.post('/leads', leadData);
    return response.data;
  },
  updateLeadStatus: async (id: string, status: string) => {
    const response = await api.put(`/leads/${id}/status`, { status });
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
  getAdvanceRequests: async () => {
    const response = await api.get('/advance-requests');
    return response.data;
  },
  updateAdvanceStatus: async (id: string, status: string) => {
    const response = await api.put(`/advance-requests/${id}/status`, { status });
    return response.data;
  },
};

export const fieldService = {
  logExpense: async (expenseData: any) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },
  getLedgerBySite: async (siteId: string) => {
    const response = await api.get(`/expenses/site/${siteId}`);
    return response.data;
  },
  getSupervisorWallet: async (userId: string) => {
    const response = await api.get(`/wallet/${userId}`);
    return response.data;
  },
  submitAttendance: async (attendanceData: any) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },
  logFuel: async (fuelData: any) => {
    const response = await api.post('/fuel', fuelData);
    return response.data;
  },
  logTrip: async (tripData: any) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },
  requestAdvance: async (advanceData: any) => {
    const response = await api.post('/advance-request', advanceData);
    return response.data;
  },
  payAdvance: async (payData: any) => {
    const response = await api.post('/advance-request/pay', payData);
    return response.data;
  },
};

export default api;
