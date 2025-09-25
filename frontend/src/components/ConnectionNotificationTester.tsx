import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ConnectionService from '../services/connection.service';

const ConnectionNotificationTester: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState(ConnectionService.getConnectionStatus());
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const handleConnectionChange = (status: any) => {
      setConnectionStatus(status);
      addTestResult(`Connection changed: ${status.isConnected ? 'Connected' : 'Disconnected'}`);
    };

    ConnectionService.onConnectionChange(handleConnectionChange);

    return () => {
      ConnectionService.offConnectionChange(handleConnectionChange);
    };
  }, []);

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`${timestamp}: ${result}`, ...prev.slice(0, 9)]);
  };

  const testOfflineNotification = () => {
    ConnectionService.emit('offline');
    addTestResult('Offline notification triggered');
  };

  const testOnlineNotification = () => {
    ConnectionService.emit('online');
    addTestResult('Online notification triggered');
  };

  const testAllScreens = () => {
    Alert.alert(
      'Test All Screens',
      'This will test connection notifications on all screens. Navigate through the app and check if notifications appear on:\n\n• Welcome Screen\n• Login Screen\n• Register Screen\n• Home Screen\n• Rides Screen\n• Drive Screen\n• Wallet Screen\n• Profile Screen',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Test', 
          onPress: () => {
            addTestResult('Starting all-screens test');
            // Trigger both notifications to test visibility
            setTimeout(() => testOfflineNotification(), 1000);
            setTimeout(() => testOnlineNotification(), 3000);
          }
        }
      ]
    );
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const getStatusColor = () => {
    if (connectionStatus.isConnected && connectionStatus.isInternetReachable === true) {
      return '#28A745';
    } else if (connectionStatus.isConnected && connectionStatus.isInternetReachable === false) {
      return '#FFA500';
    } else {
      return '#FF4C4C';
    }
  };

  const getStatusText = () => {
    if (connectionStatus.isConnected && connectionStatus.isInternetReachable === true) {
      return 'Online';
    } else if (connectionStatus.isConnected && connectionStatus.isInternetReachable === false) {
      return 'Connected (No Internet)';
    } else {
      return 'Offline';
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>Connection Notification Tester</Text>
        <Text style={styles.subtitle}>Test notifications across all screens</Text>
        
        {/* Current Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        {/* Test Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={testAllScreens}
            style={[styles.button, styles.primaryButton]}
            icon="play-arrow"
          >
            Test All Screens
          </Button>
          
          <View style={styles.testButtonsRow}>
            <Button
              mode="outlined"
              onPress={testOfflineNotification}
              style={[styles.button, styles.testButton]}
              icon="wifi-off"
            >
              Test Offline
            </Button>
            
            <Button
              mode="outlined"
              onPress={testOnlineNotification}
              style={[styles.button, styles.testButton]}
              icon="wifi"
            >
              Test Online
            </Button>
          </View>
        </View>

        {/* Test Results */}
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Test Results</Text>
            <TouchableOpacity onPress={clearTestResults} style={styles.clearButton}>
              <MaterialIcons name="clear" size={16} color="#666" />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
            {testResults.length === 0 ? (
              <Text style={styles.noResults}>No test results yet</Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={styles.resultItem}>
                  {result}
                </Text>
              ))
            )}
          </ScrollView>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Test:</Text>
          <Text style={styles.instructionText}>
            1. Tap "Test All Screens" to start comprehensive testing{'\n'}
            2. Navigate through all app screens using the bottom tabs{'\n'}
            3. Check that notifications appear in the bottom-right corner{'\n'}
            4. Verify notifications have correct colors and animations{'\n'}
            5. Test with real network changes (turn WiFi/mobile data on/off)
          </Text>
        </View>

        {/* Screen Coverage */}
        <View style={styles.coverageContainer}>
          <Text style={styles.coverageTitle}>Screen Coverage:</Text>
          <View style={styles.screenList}>
            {[
              'Welcome Screen',
              'Login Screen', 
              'Register Screen',
              'Home Screen',
              'Rides Screen',
              'Drive Screen',
              'Wallet Screen',
              'Profile Screen'
            ].map((screen, index) => (
              <View key={index} style={styles.screenItem}>
                <MaterialIcons name="check-circle" size={16} color="#28A745" />
                <Text style={styles.screenText}>{screen}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    marginVertical: 4,
  },
  primaryButton: {
    backgroundColor: '#000',
  },
  testButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  testButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  resultsList: {
    maxHeight: 120,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 8,
  },
  noResults: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  resultItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  coverageContainer: {
    marginBottom: 10,
  },
  coverageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  screenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  screenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 4,
  },
  screenText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
});

export default ConnectionNotificationTester;
