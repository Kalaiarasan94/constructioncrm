import React, { useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fieldService } from '../services/api';

export default function CashExpenseScreen() {
  const router = useRouter();
  const { siteId, siteName, userId } = useLocalSearchParams();
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);

  const sendToWhatsApp = (message: string) => {
    const phoneNumber = '919876543210'; // Replace with actual supervisor/admin number
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("WhatsApp Not Found", "Please install WhatsApp to send reports.");
      }
    });
  };

  const handleSave = async () => {
    if (!description || !cost) {
      Alert.alert('Incomplete Fields', 'Please add an item description and cost.');
      return;
    }

    setLoading(true);
    try {
      await fieldService.logExpense({
        siteId: siteId,
        userId: userId,
        type: 'DEBIT',
        category: 'Petty Cash',
        description: description,
        amount: parseFloat(cost),
        date: new Date().toISOString().split('T')[0]
      });

      const expenseMessage = `💸 *CASH EXPENSE REPORT*\n\n` +
        `📍 *Site:* ${siteName || 'Not Specified'}\n` +
        `📝 *Description:* ${description}\n` +
        `💰 *Amount:* ₹${cost}\n` +
        `📅 *Date:* ${new Date().toLocaleDateString()}\n` +
        `✅ *Status:* Paid from Petty Cash & Logged to DB`;

      setLoading(false);
      Alert.alert('Expense Recorded', `₹${cost} logged into database and recorded.`, [
        { text: 'Send WhatsApp Report', onPress: () => {
          sendToWhatsApp(expenseMessage);
          router.back();
        }},
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save expense to database.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 20 }}>
      <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 5 }}>Site: {siteName || 'General'}</Text>
      <View style={{ height: 20 }} />
      
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>EXPENSE ITEM DESCRIPTION</Text>
      <TextInput style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 14, borderRadius: 8, marginBottom: 20 }} placeholder="e.g. Tea & Snacks for laborers, Unloading tips" value={description} onChangeText={setDescription} />

      <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>AMOUNT PAID (₹)</Text>
      <TextInput style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 14, borderRadius: 8, marginBottom: 24 }} placeholder="0.00" keyboardType="numeric" value={cost} onChangeText={setCost} />

      <TouchableOpacity 
        style={{ backgroundColor: '#1E293B', padding: 16, borderRadius: 8, alignItems: 'center' }} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold' }}>Save Cash Expense</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}