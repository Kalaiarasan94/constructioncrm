import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, StyleSheet, Dimensions, ActivityIndicator, Image } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { adminService, fieldService } from '../services/api';

const { width } = Dimensions.get('window');

interface Staff {
  id: string;
  name: string;
  role: 'Supervisor' | 'Driver' | 'Site Engineer' | 'Admin';
  phone: string;
}

interface Site {
  id: string;
  name: string;
  location: string;
  supervisor_id?: string;
  supervisor_name?: string;
}

interface Lead {
  id: string;
  name: string;
  project_needed: string;
  source: string;
  status: 'Hot Lead' | 'In Discussion' | 'Converted Client';
}

export default function AdminPanelScreen() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<'ANALYTICS' | 'CRM_LEADS' | 'STAFF_HR' | 'ALLOCATIONS' | 'ADVANCES' | 'REPORTS'>('ANALYTICS');
  const [loading, setLoading] = useState(false);

  // ---- STAFF HR STATE ----
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'Supervisor' | 'Driver' | 'Site Engineer'>('Supervisor');
  const [staffPhone, setStaffPhone] = useState('');

  // ---- ADVANCES STATE ----
  const [advanceRequests, setAdvanceRequests] = useState<any[]>([]);

  // ---- LEADS STATE ----
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [leadName, setLeadName] = useState('');
  const [leadProject, setLeadProject] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [leadStatus, setLeadStatus] = useState<'Hot Lead' | 'In Discussion' | 'Converted Client'>('Hot Lead');

  // ---- SITES STATE ----
  const [sitesList, setSitesList] = useState<Site[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [selectedSiteForAllocation, setSelectedSiteForAllocation] = useState<string | null>(null);
  const [selectedSupervisorForAllocation, setSelectedSupervisorForAllocation] = useState<string | null>(null);

  // ---- ANALYTICS STATE ----
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedSiteLedger, setSelectedSiteLedger] = useState<any[]>([]);
  const [activeLedgerSite, setActiveLedgerSite] = useState<string | null>(null);

  // ---- REPORTS STATE ----
  const [reportSiteId, setReportSiteId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    if (currentTab === 'ANALYTICS') {
      fetchAnalytics();
    } else if (currentTab === 'STAFF_HR') {
      fetchStaff();
    } else if (currentTab === 'CRM_LEADS') {
      fetchLeads();
    } else if (currentTab === 'ALLOCATIONS' || currentTab === 'REPORTS') {
      fetchSites();
      fetchStaff();
    } else if (currentTab === 'ADVANCES') {
      fetchAdvanceRequests();
    }
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === 'REPORTS' && reportSiteId) {
      fetchReportData();
    }
  }, [reportSiteId, currentTab]);

  const fetchReportData = async () => {
    if (!reportSiteId) return;
    setLoading(true);
    try {
      const data = await fieldService.getLedgerBySite(reportSiteId);
      setReportData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvanceRequests = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAdvanceRequests();
      setAdvanceRequests(data);
    } catch (error) {
      console.error('Error fetching advances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdvanceStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await adminService.updateAdvanceStatus(id, status);
      fetchAdvanceRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const fetchSiteLedger = async (siteId: string) => {
    setLoading(true);
    try {
      const data = await fieldService.getLedgerBySite(siteId);
      setSelectedSiteLedger(data);
      setActiveLedgerSite(siteId);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch site ledger.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await adminService.getStaff();
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await adminService.getLeads();
      setLeadsList(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSites();
      setSitesList(data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!staffName || !staffPhone || !staffUsername || !staffPassword) {
      Alert.alert('Error', 'Please fill out all staff credentials.');
      return;
    }
    
    setLoading(true);
    try {
      await adminService.addStaff({
        name: staffName,
        username: staffUsername,
        role: staffRole,
        phone: staffPhone,
        password: staffPassword
      });
      setStaffName('');
      setStaffUsername('');
      setStaffPassword('');
      setStaffPhone('');
      Alert.alert('Success', 'Staff credentials registered.');
      fetchStaff();
    } catch (error) {
      Alert.alert('Error', 'Failed to register staff.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async () => {
    if (!leadName || !leadProject || !leadSource) {
      Alert.alert('Error', 'Please fill out all lead details.');
      return;
    }
    
    setLoading(true);
    try {
      await adminService.createLead({
        name: leadName,
        projectNeeded: leadProject,
        source: leadSource,
        status: leadStatus
      });
      setLeadName('');
      setLeadProject('');
      setLeadSource('');
      Alert.alert('Success', 'Lead created successfully.');
      fetchLeads();
    } catch (error) {
      Alert.alert('Error', 'Failed to create lead.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async () => {
    if (!newSiteName || !newSiteLocation) {
      Alert.alert('Error', 'Please enter site name and location.');
      return;
    }
    setLoading(true);
    try {
      await adminService.createSite({ name: newSiteName, location: newSiteLocation });
      setNewSiteName('');
      setNewSiteLocation('');
      Alert.alert('Success', 'Site created.');
      fetchSites();
    } catch (error) {
      Alert.alert('Error', 'Failed to create site.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    Alert.alert('Confirm', 'Delete this site?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          await adminService.deleteSite(id);
          fetchSites();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete site.');
        } finally {
          setLoading(false);
        }
      }}
    ]);
  };

  const handleAllocateSupervisor = async () => {
    if (!selectedSiteForAllocation || !selectedSupervisorForAllocation) {
      Alert.alert('Error', 'Select both a site and a supervisor.');
      return;
    }
    setLoading(true);
    try {
      await adminService.allocateSupervisor(selectedSupervisorForAllocation, selectedSiteForAllocation);
      Alert.alert('Success', 'Supervisor allocated to site.');
      setSelectedSiteForAllocation(null);
      setSelectedSupervisorForAllocation(null);
      fetchSites();
    } catch (error) {
      Alert.alert('Error', 'Failed to allocate supervisor.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (id: string, newStatus: string) => {
    try {
      await adminService.updateLeadStatus(id, newStatus);
      fetchLeads();
    } catch (error) {
      Alert.alert('Error', 'Failed to update lead status.');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this staff member?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await adminService.deleteStaff(id);
              fetchStaff();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete staff.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Stack.Screen 
        options={{
          headerTitle: "Admin Panel",
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.replace('/')}
              style={{ marginRight: 15, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
            >
              <MaterialIcons name="logout" size={16} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 12 }}>LOGOUT</Text>
            </TouchableOpacity>
          ),
        }} 
      />

      {/* Tabs Navigation */}
      <View style={{ flexDirection: 'row', backgroundColor: '#0F172A', padding: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { id: 'ANALYTICS', label: 'Dashboard', icon: 'dashboard' },
              { id: 'REPORTS', label: 'Reports', icon: 'description' },
              { id: 'CRM_LEADS', label: 'CRM Leads', icon: 'people' },
              { id: 'STAFF_HR', label: 'Staff & Credentials', icon: 'badge' },
              { id: 'ADVANCES', label: 'Advances', icon: 'payments' },
              { id: 'ALLOCATIONS', label: 'Site Allocations', icon: 'location-on' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
                  backgroundColor: currentTab === tab.id ? '#38BDF8' : '#1E293B'
                }}
                onPress={() => setCurrentTab(tab.id as any)}
              >
                <MaterialIcons name={tab.icon as any} size={16} color={currentTab === tab.id ? '#0F172A' : '#94A3B8'} />
                <Text style={{ color: currentTab === tab.id ? '#0F172A' : '#E2E8F0', fontWeight: 'bold', fontSize: 13 }}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        
        {/* ================= WORKSPACE: ANALYTICS DASHBOARD ================= */}
        {currentTab === 'ANALYTICS' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>Business Analytics</Text>
            
            {loading && !analytics ? (
              <ActivityIndicator size="large" color="#0F172A" />
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  <View style={{ backgroundColor: '#FFF', width: '48%', padding: 16, borderRadius: 12, elevation: 2 }}>
                    <Text style={{ color: '#64748B', fontSize: 12 }}>Total Leads</Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginTop: 4 }}>
                      {analytics?.leadsChannelPerformance?.reduce((acc: number, curr: any) => acc + curr.total_leads, 0) || 0}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#FFF', width: '48%', padding: 16, borderRadius: 12, elevation: 2 }}>
                    <Text style={{ color: '#64748B', fontSize: 12 }}>Conversions</Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginTop: 4 }}>
                      {analytics?.leadsChannelPerformance?.reduce((acc: number, curr: any) => acc + curr.converted_leads, 0) || 0}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 12 }}>Site-wise Expenses</Text>
                <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 20 }}>
                  {analytics?.siteWiseExpenseBreakdown?.map((exp: any, idx: number) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={{ marginBottom: 16 }}
                      onPress={() => fetchSiteLedger(exp.id)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>{exp.site_name}</Text>
                          {activeLedgerSite === exp.id && <MaterialIcons name="arrow-drop-down" size={20} color="#0F172A" />}
                        </View>
                        <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: 'bold' }}>₹{Number(exp.total_expenses).toLocaleString()}</Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ height: '100%', backgroundColor: ['#38BDF8', '#818CF8', '#FB923C'][idx % 3], width: `${Math.min((exp.total_expenses / 100000) * 100, 100)}%` }} />
                      </View>
                      
                      {activeLedgerSite === exp.id && (
                        <View style={{ marginTop: 12, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
                            <View>
                              <Text style={{ fontSize: 9, color: '#64748B', fontWeight: 'bold' }}>DIRECT (CASH)</Text>
                              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#10B981' }}>₹{Number(exp.direct_expenses).toLocaleString()}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 9, color: '#64748B', fontWeight: 'bold' }}>INDIRECT (CREDIT)</Text>
                              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6366F1' }}>₹{Number(exp.indirect_expenses).toLocaleString()}</Text>
                            </View>
                          </View>

                          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#64748B', marginBottom: 8 }}>RECENT BILLS / EXPENSES</Text>
                          {selectedSiteLedger.slice(0, 5).map((item: any) => (
                            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 4 }}>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0F172A' }}>{item.category}</Text>
                                  <View style={{ backgroundColor: item.payment_mode === 'Direct' ? '#DCFCE7' : '#EEF2FF', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                                    <Text style={{ fontSize: 7, fontWeight: 'bold', color: item.payment_mode === 'Direct' ? '#166534' : '#4338CA' }}>{item.payment_mode?.toUpperCase()}</Text>
                                  </View>
                                </View>
                                <Text style={{ fontSize: 10, color: '#64748B' }} numberOfLines={1}>{item.description}</Text>
                              </View>
                              <Text style={{ fontSize: 11, fontWeight: 'bold', color: item.type === 'CREDIT' ? '#10B981' : '#0F172A' }}>
                                {item.type === 'DEBIT' ? '-' : '+'} ₹{Number(item.amount).toLocaleString()}
                              </Text>
                            </View>
                          ))}
                          {selectedSiteLedger.length === 0 && <Text style={{ fontSize: 10, color: '#94A3B8' }}>No records found.</Text>}
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                  {(!analytics?.siteWiseExpenseBreakdown || analytics.siteWiseExpenseBreakdown.length === 0) && (
                    <Text style={{ color: '#64748B', textAlign: 'center' }}>No expense data recorded yet.</Text>
                  )}
                </View>
              </>
            )}

            <View style={{ backgroundColor: '#0F172A', padding: 20, borderRadius: 12, alignItems: 'center' }}>
                <FontAwesome5 name="chart-line" size={40} color="#38BDF8" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', marginTop: 12 }}>Detailed Reports coming soon</Text>
            </View>
          </View>
        )}

        {/* ================= WORKSPACE: REPORTS (EXPENSES WITH IMAGES) ================= */}
        {currentTab === 'REPORTS' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A' }}>Expense Reports</Text>
              <TouchableOpacity 
                style={{ backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={() => Alert.alert("Print Feature", "PDF generation requires a system printer or additional plugin. Displaying list for review.")}
              >
                <MaterialIcons name="picture-as-pdf" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>EXPORT</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 8 }}>FILTER BY PROJECT SITE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {sitesList.map((site) => (
                  <TouchableOpacity 
                    key={site.id} 
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: reportSiteId === site.id ? '#0F172A' : '#E2E8F0' }} 
                    onPress={() => setReportSiteId(site.id)}
                  >
                    <Text style={{ fontSize: 11, color: reportSiteId === site.id ? '#FFF' : '#475569', fontWeight: 'bold' }}>{site.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {loading ? (
              <ActivityIndicator size="large" color="#0F172A" />
            ) : reportSiteId ? (
              <View>
                {/* Table Header */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                   <View style={{ flex: 1, backgroundColor: '#064E3B', padding: 8, borderRadius: 6, alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>DIRECT (CASH)</Text>
                   </View>
                   <View style={{ flex: 1, backgroundColor: '#312E81', padding: 8, borderRadius: 6, alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>INDIRECT (CREDIT)</Text>
                   </View>
                </View>

                {/* Table Content */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Column 1: Direct */}
                  <View style={{ flex: 1 }}>
                    {reportData.filter(i => i.type === 'DEBIT' && i.payment_mode === 'Direct').length > 0 ? (
                      reportData.filter(i => i.type === 'DEBIT' && i.payment_mode === 'Direct').map((item) => (
                        <View key={item.id} style={{ backgroundColor: '#FFF', padding: 8, borderRadius: 10, marginBottom: 10, elevation: 1, borderWidth: 1, borderColor: '#DCFCE7' }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0F172A' }}>{item.category}</Text>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534', marginVertical: 2 }}>₹{Number(item.amount).toLocaleString()}</Text>
                          <Text style={{ fontSize: 9, color: '#64748B' }}>{new Date(item.date).toLocaleDateString()}</Text>
                          {item.image_url && (
                            <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 6 }}>
                              <Image source={{ uri: item.image_url }} style={{ width: '100%', height: 100, borderRadius: 6 }} resizeMode="cover" />
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 10 }}>No cash bills.</Text>
                    )}
                  </View>

                  {/* Column 2: Indirect */}
                  <View style={{ flex: 1 }}>
                    {reportData.filter(i => i.type === 'DEBIT' && i.payment_mode === 'Indirect').length > 0 ? (
                      reportData.filter(i => i.type === 'DEBIT' && i.payment_mode === 'Indirect').map((item) => (
                        <View key={item.id} style={{ backgroundColor: '#FFF', padding: 8, borderRadius: 10, marginBottom: 10, elevation: 1, borderWidth: 1, borderColor: '#EEF2FF' }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0F172A' }}>{item.category}</Text>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4338CA', marginVertical: 2 }}>₹{Number(item.amount).toLocaleString()}</Text>
                          <Text style={{ fontSize: 9, color: '#64748B' }}>{new Date(item.date).toLocaleDateString()}</Text>
                          {item.image_url && (
                            <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 6 }}>
                              <Image source={{ uri: item.image_url }} style={{ width: '100%', height: 100, borderRadius: 6 }} resizeMode="cover" />
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 10 }}>No credit bills.</Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <MaterialIcons name="touch-app" size={48} color="#CBD5E1" />
                <Text style={{ color: '#94A3B8', marginTop: 12 }}>Select a site above to view detailed reports.</Text>
              </View>
            )}
          </View>
        )}

        {/* ================= WORKSPACE: STAFF & CREDENTIALS ================= */}
        {currentTab === 'STAFF_HR' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>Credential Management</Text>
            
            <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 20 }}>
              <TextInput style={styles.input} placeholder="Staff Full Name" value={staffName} onChangeText={setStaffName} />
              <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={staffPhone} onChangeText={setStaffPhone} />
              <TextInput style={styles.input} placeholder="System Username (for Login)" value={staffUsername} onChangeText={setStaffUsername} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Login Password" value={staffPassword} onChangeText={setStaffPassword} secureTextEntry />
              
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 8 }}>ASSIGN ROLE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['Supervisor', 'Driver', 'Site Engineer'].map((role) => (
                  <TouchableOpacity key={role} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: staffRole === role ? '#0F172A' : '#E2E8F0' }} onPress={() => setStaffRole(role as any)}>
                    <Text style={{ fontSize: 11, color: staffRole === role ? '#FFF' : '#475569', fontWeight: 'bold' }}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={{ backgroundColor: '#0F172A', padding: 14, borderRadius: 8, alignItems: 'center' }} onPress={handleAddStaff} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Create Staff Account</Text>}
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#64748B', marginBottom: 12 }}>System Users</Text>
            {loading && staffList.length === 0 ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              staffList.map((staff) => (
                <View key={staff.id} style={{ backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 }}>
                  <View style={{ backgroundColor: '#F3E8FF', padding: 10, borderRadius: 8 }}>
                    <MaterialIcons name="security" size={20} color="#9333EA" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0F172A' }}>{staff.name}</Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>{staff.role} • {staff.phone}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteStaff(staff.id)} style={{ padding: 8 }}>
                    <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= WORKSPACE: ADVANCE REQUESTS ================= */}
        {currentTab === 'ADVANCES' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>Advance Approvals</Text>
            {loading && advanceRequests.length === 0 ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              advanceRequests.map((req) => (
                <View key={req.id} style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>{req.user_name}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>{req.user_role} • {new Date(req.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ backgroundColor: req.status === 'APPROVED' ? '#DCFCE7' : req.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: req.status === 'APPROVED' ? '#166534' : req.status === 'REJECTED' ? '#991B1B' : '#854D0E' }}>{req.status}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginTop: 12 }}>₹{Number(req.amount).toLocaleString()}</Text>
                  <Text style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Reason: {req.reason}</Text>
                  
                  {req.status === 'PENDING' && (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }}>
                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: '#10B981', padding: 10, borderRadius: 8, alignItems: 'center' }}
                        onPress={() => handleUpdateAdvanceStatus(req.id, 'APPROVED')}
                      >
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>APPROVE</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: '#EF4444', padding: 10, borderRadius: 8, alignItems: 'center' }}
                        onPress={() => handleUpdateAdvanceStatus(req.id, 'REJECTED')}
                      >
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>REJECT</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
            {advanceRequests.length === 0 && !loading && (
              <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 20 }}>No pending advance requests.</Text>
            )}
          </View>
        )}

        {/* ================= WORKSPACE: CRM LEADS ================= */}
        {currentTab === 'CRM_LEADS' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>Lead Management</Text>
            
            <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 20 }}>
              <TextInput style={styles.input} placeholder="Lead / Client Name" value={leadName} onChangeText={setLeadName} />
              <TextInput style={styles.input} placeholder="Project Requirement" value={leadProject} onChangeText={setLeadProject} />
              <TextInput style={styles.input} placeholder="Lead Source (e.g. Website, Friend)" value={leadSource} onChangeText={setLeadSource} />
              
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 8 }}>INITIAL STATUS</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['Hot Lead', 'In Discussion', 'Converted Client'].map((status) => (
                  <TouchableOpacity key={status} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: leadStatus === status ? '#38BDF8' : '#E2E8F0' }} onPress={() => setLeadStatus(status as any)}>
                    <Text style={{ fontSize: 10, color: leadStatus === status ? '#0F172A' : '#475569', fontWeight: 'bold' }}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={{ backgroundColor: '#0F172A', padding: 14, borderRadius: 8, alignItems: 'center' }} onPress={handleAddLead} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Register New Lead</Text>}
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#64748B', marginBottom: 12 }}>Active Lead Pipeline</Text>
            {loading && leadsList.length === 0 ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              leadsList.map((lead) => (
                <View key={lead.id} style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 10, marginBottom: 10, elevation: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0F172A' }}>{lead.name}</Text>
                      <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{lead.project_needed}</Text>
                      <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Source: {lead.source}</Text>
                    </View>
                    <View style={{ backgroundColor: lead.status === 'Converted Client' ? '#DCFCE7' : lead.status === 'Hot Lead' ? '#FEE2E2' : '#FEF9C3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: lead.status === 'Converted Client' ? '#166534' : lead.status === 'Hot Lead' ? '#991B1B' : '#854D0E' }}>{lead.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }}>
                    {['In Discussion', 'Converted Client'].map((status) => (
                      lead.status !== status && (
                        <TouchableOpacity key={status} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9' }} onPress={() => handleUpdateLeadStatus(lead.id, status)}>
                          <Text style={{ fontSize: 10, color: '#475569', fontWeight: 'bold' }}>MOVE TO {status.toUpperCase()}</Text>
                        </TouchableOpacity>
                      )
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= WORKSPACE: SITE ALLOCATIONS ================= */}
        {currentTab === 'ALLOCATIONS' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>Site Management</Text>
            
            {/* Create New Site */}
            <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 12 }}>CREATE NEW PROJECT SITE</Text>
              <TextInput style={styles.input} placeholder="Project Site Name (e.g. Alpha Madurai)" value={newSiteName} onChangeText={setNewSiteName} />
              <TextInput style={styles.input} placeholder="Site Location / Address" value={newSiteLocation} onChangeText={setNewSiteLocation} />
              <TouchableOpacity style={{ backgroundColor: '#0F172A', padding: 14, borderRadius: 8, alignItems: 'center' }} onPress={handleAddSite} disabled={loading}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Add Project Site</Text>
              </TouchableOpacity>
            </View>

            {/* Allocate Supervisor */}
            {sitesList.length > 0 && staffList.filter(s => s.role === 'Supervisor').length > 0 && (
              <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 12 }}>ALLOCATE SUPERVISOR TO SITE</Text>
                
                <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>SELECT SITE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {sitesList.map((site) => (
                      <TouchableOpacity key={site.id} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: selectedSiteForAllocation === site.id ? '#0284C7' : '#E2E8F0' }} onPress={() => setSelectedSiteForAllocation(site.id)}>
                        <Text style={{ fontSize: 11, color: selectedSiteForAllocation === site.id ? '#FFF' : '#475569', fontWeight: 'bold' }}>{site.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>SELECT SUPERVISOR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {staffList.filter(s => s.role === 'Supervisor').map((staff) => (
                      <TouchableOpacity key={staff.id} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: selectedSupervisorForAllocation === staff.id ? '#9333EA' : '#E2E8F0' }} onPress={() => setSelectedSupervisorForAllocation(staff.id)}>
                        <Text style={{ fontSize: 11, color: selectedSupervisorForAllocation === staff.id ? '#FFF' : '#475569', fontWeight: 'bold' }}>{staff.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <TouchableOpacity style={{ backgroundColor: '#0284C7', padding: 14, borderRadius: 8, alignItems: 'center' }} onPress={handleAllocateSupervisor} disabled={loading}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Update Allocation</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#64748B', marginBottom: 12 }}>Active Projects</Text>
            {loading && sitesList.length === 0 ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              sitesList.map((site) => (
                <View key={site.id} style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={{ backgroundColor: '#E0F2FE', padding: 10, borderRadius: 8 }}>
                        <MaterialIcons name="business" size={24} color="#0284C7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0F172A' }}>{site.name}</Text>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>{site.location}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteSite(site.id)} style={{ padding: 8 }}>
                      <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={{ marginTop: 12, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#64748B' }}>ALLOCATED SUPERVISOR</Text>
                      <Text style={{ fontSize: 13, color: site.supervisor_name ? '#0F172A' : '#94A3B8', fontWeight: 'bold', marginTop: 2 }}>
                        {site.supervisor_name || 'NOT ASSIGNED'}
                      </Text>
                    </View>
                    {site.supervisor_name && (
                      <MaterialIcons name="verified-user" size={18} color="#10B981" />
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
});
