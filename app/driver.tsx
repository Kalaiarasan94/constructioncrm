import React, { useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

// ==========================================
// 1. EMBEDDED API CLIENT LAYER
// ==========================================
const COMPUTER_IP_ADDRESS = '192.168.1.20'; 
const API_BASE_URL = `http://${COMPUTER_IP_ADDRESS}:5000/api`;

const localApiClient = {
  async logMaterialDelivery(payload: {
    siteId: number;
    materialType: string;
    quantity: string;
    supplierName: string;
    vehicleNumber: string;
    driverName: string;
    date: string;
  }) {
    return (await axios.post(`${API_BASE_URL}/expenses`, {
      siteId: payload.siteId,
      type: 'DEBIT',
      category: 'Material',
      description: `Delivery: ${payload.quantity} of ${payload.materialType} via ${payload.vehicleNumber} (${payload.supplierName})`,
      amount: 0, // Left at 0 for Admin to update via official invoice later
      date: payload.date,
      supervisorName: payload.driverName
    })).data;
  },

  async logFuelRefill(payload: {
    siteId: number;
    vehicleNumber: string;
    fuelLiters: number;
    amountPaid: number;
    date: string;
    driverName: string;
  }) {
    return (await axios.post(`${API_BASE_URL}/expenses`, {
      siteId: payload.siteId,
      type: 'DEBIT',
      category: 'Fuel',
      description: `Fuel Refill: ${payload.fuelLiters}L for ${payload.vehicleNumber}`,
      amount: payload.amountPaid,
      date: payload.date,
      supervisorName: payload.driverName
    })).data;
  }
};

// ==========================================
// 2. DRIVER MODULE USER INTERFACE
// ==========================================
export default function DriverLogScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'material' | 'fuel'>('material');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shared Core Identities
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Material Flow Sub-States
  const [materialType, setMaterialType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplierName, setSupplierName] = useState('');

  // Fuel Flow Sub-States
  const [fuelLiters, setFuelLiters] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  const handleLogMaterial = async () => {
    if (!driverName || !vehicleNumber || !materialType || !quantity) {
      Alert.alert('Missing Info', 'Please fill in your name, vehicle number, material type, and quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      await localApiClient.logMaterialDelivery({
        siteId: 1, // Maps to your active Project site ID
        materialType,
        quantity,
        supplierName: supplierName || 'Direct Cash Procurement',
        vehicleNumber,
        driverName,
        date: new Date().toISOString().split('T')[0]
      });

      Alert.alert('Success', 'Material delivery entry successfully synced with PostgreSQL.');
      clearForm();
    } catch (error: any) {
      Alert.alert('Connection Failure', error.message || 'Could not dispatch data to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogFuel = async () => {
    if (!driverName || !vehicleNumber || !fuelLiters || !amountPaid) {
      Alert.alert('Missing Info', 'Please complete all fields to process fuel logs.');
      return;
    }

    try {
      setIsSubmitting(true);
      await localApiClient.logFuelRefill({
        siteId: 1,
        vehicleNumber,
        fuelLiters: parseFloat(fuelLiters),
        amountPaid: parseFloat(amountPaid),
        driverName,
        date: new Date().toISOString().split('T')[0]
      });

      Alert.alert('Success', 'Fuel voucher debit logged into PostgreSQL.');
      clearForm();
    } catch (error: any) {
      Alert.alert('Connection Failure', error.message || 'Could not dispatch data to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setMaterialType('');
    setQuantity('');
    setSupplierName('');
    setFuelLiters('');
    setAmountPaid('');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0F172A' }}>Logistics & Driver Desk</Text>
        <TouchableOpacity 
          onPress={() => router.replace('/')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
        >
          <MaterialIcons name="logout" size={14} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 }}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>Submit raw transit data directly into the database system</Text>

      {/* Driver & Truck Verification Card */}
      <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 6 }}>DRIVER / OPERATOR NAME</Text>
        <TextInput 
          style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 6, marginBottom: 12 }}
          placeholder="Enter driver fullname" 
          value={driverName}
          onChangeText={setDriverName}
        />
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 6 }}>VEHICLE NUMBER</Text>
        <TextInput 
          style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 6 }}
          placeholder="e.g., TN-58-AA-1111" 
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
        />
      </View>

      {/* Toggle View Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 4, marginBottom: 20 }}>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: activeTab === 'material' ? '#FFF' : 'transparent', borderRadius: 6 }}
          onPress={() => setActiveTab('material')}
        >
          <Text style={{ fontWeight: 'bold', color: activeTab === 'material' ? '#0F172A' : '#64748B' }}>Material Supply</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: activeTab === 'fuel' ? '#FFF' : 'transparent', borderRadius: 6 }}
          onPress={() => setActiveTab('fuel')}
        >
          <Text style={{ fontWeight: 'bold', color: activeTab === 'fuel' ? '#0F172A' : '#64748B' }}>Fuel Refill</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Content Switching */}
      {activeTab === 'material' ? (
        <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 30 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 6 }}>MATERIAL CLASSIFICATION</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 6, marginBottom: 14 }} placeholder="e.g., Cement Bags, Aggregate, Brick" value={materialType} onChangeText={setMaterialType} />
          
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 6 }}>QUANTITY MEASURE</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 6, marginBottom: 14 }} placeholder="e.g., 100 Bags, 3 Units" value={quantity} onChangeText={setQuantity} />
          
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 6 }}>SUPPLIER YARD / SOURCE</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 6, marginBottom: 20 }} placeholder="e.g., Siva Blue Metals" value={supplierName} onChangeText={setSupplierName} />

          <TouchableOpacity style={{ backgroundColor: '#0284C7', padding: 16, borderRadius: 6, alignItems: 'center' }} onPress={handleLogMaterial} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Submit Material Manifest</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 30 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 6 }}>VOLUME (Liters)</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 6, marginBottom: 14 }} keyboardType="numeric" placeholder="0" value={fuelLiters} onChangeText={setFuelLiters} />
          
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 6 }}>CASH/CREDIT OUTLAY VALUE (₹)</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 6, marginBottom: 20 }} keyboardType="numeric" placeholder="0.00" value={amountPaid} onChangeText={setAmountPaid} />

          <TouchableOpacity style={{ backgroundColor: '#D97706', padding: 16, borderRadius: 6, alignItems: 'center' }} onPress={handleLogFuel} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Discharge Fuel Payment</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}