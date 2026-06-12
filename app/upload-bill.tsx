import React, { useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Linking, Image, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { fieldService } from '../services/api';

interface BillItem {
  id: string;
  vendorName: string;
  amount: string;
  category: string;
  paymentMode: 'Direct' | 'Indirect';
  isGst: boolean;
  imageUri: string;
}

export default function UploadBill() {
  const router = useRouter();
  const { siteId, siteName, userId } = useLocalSearchParams();
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Cement');
  const [paymentMode, setPaymentMode] = useState<'Direct' | 'Indirect'>('Direct');
  const [isGst, setIsGst] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [billsList, setBillsList] = useState<BillItem[]>([]);

  const categories = ['Cement', 'Steel', 'Sand', 'Bricks', 'Fuel', 'Others'];

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

  const pickImage = async (useCamera: boolean) => {
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
      });
    }

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addBillToList = () => {
    if (!vendorName || !amount || !imageUri) {
      Alert.alert('Incomplete Bill', 'Please provide Vendor, Amount and Bill Photo.');
      return;
    }

    const newBill: BillItem = {
      id: Date.now().toString(),
      vendorName,
      amount,
      category,
      paymentMode,
      isGst,
      imageUri,
    };

    setBillsList([...billsList, newBill]);
    
    // Reset fields for next bill
    setVendorName('');
    setAmount('');
    setIsGst(false);
    setImageUri(null);
    Alert.alert("Success", "Bill added to list.");
  };

  const removeBill = (id: string) => {
    setBillsList(billsList.filter(b => b.id !== id));
  };

  const handleSubmitAll = async () => {
    if (billsList.length === 0) {
      Alert.alert('Empty List', 'Please add at least one bill to the list before submitting.');
      return;
    }

    setLoading(true);

    try {
      // Log each bill to the database
      for (const bill of billsList) {
        await fieldService.logExpense({
          siteId: siteId,
          userId: userId,
          type: 'DEBIT',
          category: bill.category,
          description: `Vendor: ${bill.vendorName} (${bill.paymentMode})${bill.isGst ? ' [GST]' : ''}`,
          amount: parseFloat(bill.amount),
          paymentMode: bill.paymentMode,
          isGst: bill.isGst,
          imageUrl: bill.imageUri,
          date: new Date().toISOString().split('T')[0]
        });
      }

      const totalAmount = billsList.reduce((sum, bill) => sum + parseFloat(bill.amount || '0'), 0);
      const directTotal = billsList.filter(b => b.paymentMode === 'Direct').reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const indirectTotal = totalAmount - directTotal;

      let reportMessage = `🧾 *BATCH MATERIAL BILL REPORT*\n\n`;
      reportMessage += `📍 *Site:* ${siteName || 'Not Specified'}\n`;
      reportMessage += `📊 *Total Bills:* ${billsList.length}\n`;
      reportMessage += `💰 *Batch Total:* ₹${totalAmount.toLocaleString()}\n`;
      if (directTotal > 0) reportMessage += `💵 *Direct (Cash):* ₹${directTotal.toLocaleString()}\n`;
      if (indirectTotal > 0) reportMessage += `💳 *Indirect (Credit):* ₹${indirectTotal.toLocaleString()}\n`;
      reportMessage += `\n`;
      
      billsList.forEach((bill, index) => {
        reportMessage += `${index + 1}. *${bill.vendorName}*\n`;
        reportMessage += `   📦 ${bill.category} | ₹${bill.amount}\n`;
        reportMessage += `   💳 ${bill.paymentMode} Bill\n\n`;
      });

      setLoading(false);
      Alert.alert('Batch Submitted', `Logged ${billsList.length} bills totaling ₹${totalAmount.toLocaleString()} to Database.`, [
        { text: 'Send WhatsApp Report', onPress: () => {
          sendToWhatsApp(reportMessage);
          router.replace('/supervisor-dashboard');
        }},
        { text: 'OK', onPress: () => {
          router.replace('/supervisor-dashboard');
        }}
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save bills to database.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 20 }}>
      
      <View style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>ADD NEW BILL</Text>

        <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>BILL TYPE</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity 
            style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: paymentMode === 'Direct' ? '#10B981' : '#E2E8F0', backgroundColor: paymentMode === 'Direct' ? '#F0FDF4' : '#FFF', alignItems: 'center' }}
            onPress={() => setPaymentMode('Direct')}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: paymentMode === 'Direct' ? '#10B981' : '#64748B' }}>Direct</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: paymentMode === 'Indirect' ? '#6366F1' : '#E2E8F0', backgroundColor: paymentMode === 'Indirect' ? '#EEF2FF' : '#FFF', alignItems: 'center' }}
            onPress={() => setPaymentMode('Indirect')}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: paymentMode === 'Indirect' ? '#6366F1' : '#64748B' }}>Indirect</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>GST BILL (Includes Tax)</Text>
          <TouchableOpacity 
            onPress={() => setIsGst(!isGst)}
            style={{ backgroundColor: isGst ? '#10B981' : '#CBD5E1', width: 44, height: 24, borderRadius: 12, padding: 2, alignItems: isGst ? 'flex-end' : 'flex-start' }}
          >
            <View style={{ backgroundColor: '#FFF', width: 20, height: 20, borderRadius: 10 }} />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>CATEGORY</Text>
        <View style={{ backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            style={{ height: 50, width: '100%' }}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>

        <TextInput 
          style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14 }} 
          placeholder="Vendor Name" 
          value={vendorName} 
          onChangeText={setVendorName} 
        />
        
        <TextInput 
          style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }} 
          placeholder="Amount (₹)" 
          keyboardType="numeric" 
          value={amount} 
          onChangeText={setAmount} 
        />

        <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>BILL PHOTO</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            onPress={() => pickImage(true)}
          >
            <MaterialIcons name="photo-camera" size={20} color="#475569" />
            <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 12 }}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            onPress={() => pickImage(false)}
          >
            <MaterialIcons name="photo-library" size={20} color="#475569" />
            <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 12 }}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: 150, borderRadius: 8 }} resizeMode="cover" />
            <TouchableOpacity onPress={() => setImageUri(null)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={{ backgroundColor: '#0F172A', padding: 14, borderRadius: 8, alignItems: 'center' }} 
          onPress={addBillToList}
        >
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>+ ADD TO SUBMISSION LIST</Text>
        </TouchableOpacity>
      </View>

      {billsList.length > 0 && (
        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 12 }}>BILLS IN THIS BATCH ({billsList.length})</Text>
          {billsList.map((bill) => (
            <View key={bill.id} style={{ backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 }}>
              <Image source={{ uri: bill.imageUri }} style={{ width: 50, height: 50, borderRadius: 6 }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>{bill.vendorName}</Text>
                <Text style={{ fontSize: 11, color: '#64748B' }}>{bill.category} | ₹{bill.amount} | {bill.paymentMode}</Text>
              </View>
              <TouchableOpacity onPress={() => removeBill(bill.id)}>
                <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity 
            style={{ backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10, elevation: 2 }} 
            onPress={handleSubmitAll}
          >
            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold' }}>SUBMIT ALL BILLS ({billsList.length})</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
