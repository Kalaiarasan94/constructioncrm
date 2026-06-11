import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert, Linking, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { adminService, fieldService } from '../services/api';

interface Site {
  id: string;
  name: string;
  location: string;
  supervisor_id?: string;
}

export default function SupervisorDashboard() {
  const router = useRouter();
  const { name: supervisorName, userId } = useLocalSearchParams();
  
  // Available project sites from DB
  const [projectSites, setProjectSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Financial State from DB
  const [cashInHand, setCashInHand] = useState(0);
  const [siteExpenses, setSiteExpenses] = useState(0);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (userId) {
      loadWalletData();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedSite) {
      loadLedgerData();
    } else {
      setSiteExpenses(0);
    }
  }, [selectedSite]);

  const loadSites = async () => {
    setLoading(true);
    try {
      const sites = await adminService.getSites();
      // Filter sites allocated to this supervisor
      const mySites = sites.filter((s: Site) => Number(s.supervisor_id) === Number(userId));
      setProjectSites(mySites);
      if (mySites.length > 0) {
        setSelectedSite(mySites[0]);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletData = async () => {
    if (!userId) return;
    try {
      const data = await fieldService.getSupervisorWallet(userId as string);
      setCashInHand(data.cashInHand);
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const loadLedgerData = async () => {
    if (!selectedSite || !userId) return;
    try {
      const ledger = await fieldService.getLedgerBySite(selectedSite.id);
      
      // Calculate Site Expenses (DEBIT) specifically for this user at this site
      const expenses = ledger
        .filter((item: any) => item.type === 'DEBIT' && Number(item.user_id) === Number(userId))
        .reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
      
      setSiteExpenses(expenses);
    } catch (error) {
      console.error('Error loading ledger:', error);
    }
  };

  const sendToWhatsApp = (message: string) => {
    const phoneNumber = '919876543210';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("WhatsApp Not Found", "Please install WhatsApp to send reports.");
      }
    });
  };

  const handleCheckIn = async () => {
    if (!selectedSite) return;
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

      if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Camera and Location permissions are required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        cameraType: ImagePicker.CameraType.front,
      });

      if (result.canceled) return;

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setIsCheckedIn(true);
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      setCheckInTime(timeStr);

      const checkInMessage = `🏗️ *SITE CHECK-IN REPORT*\n\n` +
        `👤 *Supervisor:* ${supervisorName || 'super'}\n` +
        `📍 *Site:* ${selectedSite.name}\n` +
        `⏰ *Time:* ${timeStr}\n` +
        `🌍 *Location:* ${latitude.toFixed(4)}, ${longitude.toFixed(4)}\n` +
        `✅ *Status:* Checked In with Selfie`;

      Alert.alert(
        "Check-In Successful",
        `Selfie captured and location recorded.`,
        [
          { text: "Send WhatsApp Report", onPress: () => sendToWhatsApp(checkInMessage) },
          { text: "OK" }
        ]
      );
    } catch (error) {
      Alert.alert('Check-In Error', 'Something went wrong.');
    }
  };

  const handleSiteChange = (siteId: string) => {
    const site = projectSites.find(s => s.id === siteId);
    if (site) {
      setSelectedSite(site);
      setIsCheckedIn(false);
      setCheckInTime(null);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 16 }}>
      <Stack.Screen 
        options={{
          headerTitle: `${supervisorName || 'Supervisor'} Panel`,
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
      
      <View style={{ backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Active Site Context</Text>
        
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', marginBottom: 6 }}>SELECT PROJECT SITE</Text>
        <View style={{ backgroundColor: '#334155', borderRadius: 8, overflow: 'hidden' }}>
          {loading ? (
            <ActivityIndicator color="#FFF" style={{ padding: 10 }} />
          ) : projectSites.length > 0 ? (
            <Picker
              selectedValue={selectedSite?.id}
              onValueChange={(itemValue) => handleSiteChange(itemValue)}
              style={{ color: '#FFFFFF' }}
              dropdownIconColor="#FFFFFF"
            >
              {projectSites.map((site) => (
                <Picker.Item key={site.id} label={site.name} value={site.id} color={Platform.OS === 'ios' ? '#FFFFFF' : '#000000'} />
              ))}
            </Picker>
          ) : (
            <View style={{ padding: 14 }}>
               <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 13 }}>NO SITE ALLOCATED</Text>
            </View>
          )}
        </View>

        {selectedSite && !isCheckedIn ? (
          <TouchableOpacity 
            onPress={handleCheckIn}
            style={{ 
              marginTop: 16, 
              backgroundColor: '#10B981', 
              padding: 12, 
              borderRadius: 8, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 8
            }}
          >
            <MaterialIcons name="add-a-photo" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>TAKE SELFIE & CHECK-IN</Text>
          </TouchableOpacity>
        ) : isCheckedIn ? (
          <View style={{ 
            marginTop: 16, 
            backgroundColor: '#064E3B', 
            padding: 10, 
            borderRadius: 8, 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 8
          }}>
            <MaterialIcons name="check-circle" size={18} color="#34D399" />
            <Text style={{ color: '#34D399', fontSize: 12, fontWeight: 'bold' }}>CHECKED IN AT {checkInTime}</Text>
          </View>
        ) : null}
      </View>

      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 10 }}>MY INDIVIDUAL WALLET</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={{ backgroundColor: '#FFFFFF', width: '48%', padding: 16, borderRadius: 12, borderLeftWidth: 5, borderLeftColor: '#10B981', elevation: 2 }}>
          <FontAwesome5 name="wallet" size={16} color="#10B981" />
          <Text style={{ color: '#64748B', fontSize: 12, marginTop: 8 }}>Available Cash</Text>
          <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>₹{cashInHand.toLocaleString()}</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', width: '48%', padding: 16, borderRadius: 12, borderLeftWidth: 5, borderLeftColor: '#3B82F6', elevation: 2 }}>
          <FontAwesome5 name="file-invoice-dollar" size={16} color="#3B82F6" />
          <Text style={{ color: '#64748B', fontSize: 12, marginTop: 8 }}>My Site Spends</Text>
          <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>₹{siteExpenses.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 12, textTransform: 'uppercase' }}>Operational Actions</Text>
      
      <TouchableOpacity 
        style={{ backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, elevation: 1, marginBottom: 12, opacity: selectedSite ? 1 : 0.5 }} 
        onPress={() => selectedSite && router.push({ pathname: '/attendance', params: { siteId: selectedSite?.id, siteName: selectedSite?.name, userId } })}
        disabled={!selectedSite}
      >
        <View style={{ backgroundColor: '#E0F2FE', padding: 10, borderRadius: 10 }}><MaterialIcons name="people" size={24} color="#0284C7" /></View>
        <View style={{ flex: 1, marginLeft: 12 }}><Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0F172A' }}>Daily Worker Attendance</Text><Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Add names and roles for total submission</Text></View>
        <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, elevation: 1, marginBottom: 12, opacity: selectedSite ? 1 : 0.5 }} 
        onPress={() => selectedSite && router.push({ pathname: '/upload-bill', params: { siteId: selectedSite?.id, siteName: selectedSite?.name, userId } })}
        disabled={!selectedSite}
      >
        <View style={{ backgroundColor: '#F1F5F9', padding: 10, borderRadius: 10 }}><MaterialIcons name="add-photo-alternate" size={24} color="#1E293B" /></View>
        <View style={{ flex: 1, marginLeft: 12 }}><Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0F172A' }}>Log Material Bill / Invoice</Text><Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Upload bills (reduces cash in hand)</Text></View>
        <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, elevation: 1, marginBottom: 12, opacity: selectedSite ? 1 : 0.5 }} 
        onPress={() => selectedSite && router.push({ pathname: '/cash-expense', params: { siteId: selectedSite?.id, siteName: selectedSite?.name, userId } })}
        disabled={!selectedSite}
      >
        <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 10 }}><MaterialIcons name="monetization-on" size={24} color="#EF4444" /></View>
        <View style={{ flex: 1, marginLeft: 12 }}><Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0F172A' }}>Daily Cash Expense</Text><Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Petty cash logs (Tea, Snacks, Tips)</Text></View>
        <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, elevation: 1, marginBottom: 30 }} 
        onPress={() => router.push({ pathname: '/advance-request', params: { userId } })}
      >
        <View style={{ backgroundColor: '#FEF3C7', padding: 10, borderRadius: 10 }}><FontAwesome5 name="hand-holding-usd" size={22} color="#D97706" /></View>
        <View style={{ flex: 1, marginLeft: 12 }}><Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0F172A' }}>Request Cash from Admin</Text><Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Raise petty cash requirement for your wallet</Text></View>
        <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
