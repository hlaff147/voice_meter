import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { apiService } from '../src/services/api';

export default function Index() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await apiService.checkHealth();
      setHealthStatus(response.status === 'healthy' ? 'Connected ✓' : 'Unknown');
    } catch (error) {
      setHealthStatus('Disconnected ✗');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Voice Meter</Text>
      <Text style={styles.subtitle}>Mobile App</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Backend Status:</Text>
        <Text style={styles.statusText}>{healthStatus}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkHealth}>
        <Text style={styles.buttonText}>Refresh Connection</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  statusContainer: {
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    width: '100%',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
