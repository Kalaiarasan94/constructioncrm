import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { authService } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(username, password);
      setLoading(false);
      
      if (response.success) {
        const { role, name, id } = response.user;
        
        if (role === 'Admin') {
          router.replace('/admin-panel');
        } else if (role === 'Accounts') {
          router.replace('/accounts-ledger');
        } else if (role === 'Supervisor' || role === 'Site Engineer') {
          router.replace({ pathname: '/supervisor-dashboard', params: { name, userId: id } });
        } else if (role === 'Driver') {
          router.replace({ pathname: '/driver', params: { name, userId: id } });
        } else {
          router.replace('/accounts-ledger');
        }
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials.');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to connect to server.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome5 name="city" size={40} color="#38BDF8" />
          </View>
          <Text style={styles.title}>Construction CRM</Text>
          <Text style={styles.subtitle}>Enterprise Resource Planning</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>USERNAME</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color="#94A3B8" />
            <TextInput 
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#94A3B8" />
            <TextInput 
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Authenticating...' : 'LOGIN TO DASHBOARD'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.credentialBox}>
          <Text style={styles.credentialTitle}>System Credentials (from DB):</Text>
          <Text style={styles.credentialText}>• Admin: admin / admin123</Text>
          <Text style={styles.credentialText}>• Accounts: accounts / acc123</Text>
          <Text style={styles.credentialText}>• Supervisor: super / super123</Text>
          <Text style={styles.credentialText}>• Driver: driver / driver123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  loginButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  credentialBox: {
    marginTop: 30,
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  credentialTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  credentialText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
});
