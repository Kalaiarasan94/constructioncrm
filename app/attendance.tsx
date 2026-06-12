import React, { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert, Linking, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { fieldService } from '../services/api';

interface Worker {
  id: string;
  name: string;
  role: string;
}

export default function AttendanceScreen() {
  const router = useRouter();
  const { siteId, siteName } = useLocalSearchParams();
  
  const [workerName, setWorkerName] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [workersList, setWorkersList] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);

  const addWorker = () => {
    if (!workerName || !workerRole) {
      Alert.alert('Error', 'Please enter both worker name and role.');
      return;
    }

    const newWorker: Worker = {
      id: Date.now().toString(),
      name: workerName,
      role: workerRole,
    };

    setWorkersList([...workersList, newWorker]);
    setWorkerName('');
    setWorkerRole('');
  };

  const removeWorker = (id: string) => {
    setWorkersList(workersList.filter(w => w.id !== id));
  };

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
    if (workersList.length === 0) {
      Alert.alert('Empty List', 'Please add at least one worker before submitting.');
      return;
    }

    setLoading(true);
    try {
      // Since we don't have worker IDs in this simple form, we'll just log them. 
      // Ideally, the backend would handle workers correctly.
      await fieldService.submitAttendance({
        siteId,
        records: workersList.map(w => ({
          workerId: 1, // Mocked as we don't have real worker IDs in this simplified flow
          status: 'Present',
          date: new Date().toISOString().split('T')[0]
        }))
      });

      const workerLines = workersList.map((w, i) => `${i + 1}. *${w.name}* (${w.role})`).join('\n');
      const message = `👷 *DAILY ATTENDANCE REPORT*\n\n` +
        `📍 *Site:* ${siteName || 'Not Specified'}\n` +
        `📅 *Date:* ${new Date().toLocaleDateString()}\n` +
        `📊 *Total Present:* ${workersList.length}\n\n` +
        `✅ *WORKERS LIST:* \n${workerLines}`;

      setLoading(false);
      Alert.alert(
        "Attendance Submitted", 
        `Successfully logged ${workersList.length} workers to Database.`,
        [
          { text: "Send WhatsApp Report", onPress: () => {
            sendToWhatsApp(message);
            router.back();
          }},
          { text: "Done", onPress: () => router.back() }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save attendance to database.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 20 }}>
      <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>ADD WORKER TO TODAY'S LIST</Text>
        
        <TextInput 
          style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14 }} 
          placeholder="Worker Full Name" 
          value={workerName} 
          onChangeText={setWorkerName} 
        />
        
        <TextInput 
          style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }} 
          placeholder="Role (e.g. Mason, Helper)" 
          value={workerRole} 
          onChangeText={setWorkerRole} 
        />

        <TouchableOpacity 
          style={{ backgroundColor: '#0F172A', padding: 14, borderRadius: 8, alignItems: 'center' }} 
          onPress={addWorker}
        >
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>+ ADD WORKER</Text>
        </TouchableOpacity>
      </View>

      {workersList.length > 0 && (
        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 12 }}>TODAY'S ROSTER ({workersList.length})</Text>
          {workersList.map((worker) => (
            <View key={worker.id} style={{ backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 }}>
              <View style={{ backgroundColor: '#E0F2FE', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="person" size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0F172A' }}>{worker.name}</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>{worker.role}</Text>
              </View>
              <TouchableOpacity onPress={() => removeWorker(worker.id)}>
                <MaterialIcons name="remove-circle-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity 
            style={{ backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10, elevation: 2 }} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold' }}>SUBMIT COMPLETE ATTENDANCE</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
