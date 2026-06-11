import axios from 'axios';

// Your computer's exact active network IPv4 address we found earlier
const COMPUTER_IP_ADDRESS = '192.168.1.20'; 

// Points directly to your Express backend server running on port 5000
const API_BASE_URL = `http://${COMPUTER_IP_ADDRESS}:5000/api`;

export const apiClient = {
  // --- Supervisor Network Calls ---
  async logExpense(payload: {
    siteId: number;
    type: 'DEBIT' | 'CREDIT';
    category: string;
    description: string;
    amount: number;
    date: string;
    supervisorName: string;
  }) {
    return (await axios.post(`${API_BASE_URL}/expenses`, payload)).data;
  },

  async fetchSiteLedger(siteId: number) {
    return (await axios.get(`${API_BASE_URL}/expenses/site/${siteId}`)).data;
  },

  async submitAttendance(siteId: number, records: Array<{ workerName: string; date: string; status: 'Present' | 'Absent' }>) {
    return (await axios.post(`${API_BASE_URL}/attendance`, { siteId, records })).data;
  },

  // --- Admin Panel Network Calls ---
  async onboardStaff(name: string, role: string, phone: string) {
    return (await axios.post(`${API_BASE_URL}/staff`, { name, role, phone })).data;
  },

  async fetchStaffList() {
    return (await axios.get(`${API_BASE_URL}/staff`)).data;
  },

  async allocateSupervisorToSite(supervisorId: number, siteId: number) {
    return (await axios.post(`${API_BASE_URL}/allocations`, { supervisorId, siteId })).data;
  },

  async createCRMLead(companyName: string, projectNeeded: string, source: string) {
    return (await axios.post(`${API_BASE_URL}/leads`, { companyName, projectNeeded, source })).data;
  },

  async fetchBIAnalytics() {
    return (await axios.get(`${API_BASE_URL}/analytics/dashboard`)).data;
  }
};