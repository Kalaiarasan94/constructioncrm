import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../constants/Theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.headerBackground },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Supervisor Dashboard' }} />
        <Stack.Screen name="upload-bill" options={{ title: 'Log Material Bill' }} />
        <Stack.Screen name="attendance" options={{ title: 'Daily Attendance' }} />
        <Stack.Screen name="cash-expense" options={{ title: 'Log Daily Expense' }} />
        <Stack.Screen name="advance-request" options={{ title: 'Cash Advance Request' }} />
        <Stack.Screen name="log-trip" options={{ title: 'Log Vehicle Trip' }} />
        <Stack.Screen name="fuel-log" options={{ title: 'Log Fuel & Odometer' }} />
        <Stack.Screen name="accounts-ledger" options={{ title: 'Accounts & Ledger Hub' }} />
        <Stack.Screen name="admin-panel" options={{ title: 'Admin Control Panel' }} />
      </Stack>
    </SafeAreaProvider>
  );
}