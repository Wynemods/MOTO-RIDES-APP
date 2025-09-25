import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ConnectionService from '../services/connection.service';

const ConnectionTestComponent: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState(ConnectionService.getConnectionStatus());
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const handleConnectionChange = (status: any) => {
      setConnectionStatus(status);
    };

    ConnectionService.onConnectionChange(handleConnectionChange);

    return () => {
      ConnectionService.offConnectionChange(handleConnectionChange);
    };
  }, []);

  const startMonitoring = () => {
    setIsMonitoring(true);
    Alert.alert(
      'Connection Monitoring Started',
      'Turn off your WiFi or mobile data to test offline notification. Turn it back on to test online notification.',
      [{ text: 'OK' }]
    );
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    Alert.alert('Connection Monitoring Stopped', 'Monitoring has been stopped.');
  };

  const simulateOffline = () => {
    // This would normally be triggered by actual network changes
    // For testing purposes, we can manually trigger the event
    ConnectionService.emit('offline');
  };

  const simulateOnline = () => {
    // This would normally be triggered by actual network changes
    // For testing purposes, we can manually trigger the event
    ConnectionService.emit('online');
  };

  const getStatusColor = () => {
    if (connectionStatus.isConnected && connectionStatus.isInternetReachable === true) {
      return '#28A745'; // Green for online
    } else if (connectionStatus.isConnected && connectionStatus.isInternetReachable === false) {
      return '#FFA500'; // Orange for connected but no internet
    } else {
      return '#FF4C4C'; // Red for offline
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

  const getConnectionTypeText = () => {
    if (connectionStatus.type === 'wifi') {
      return 'WiFi';
    } else if (connectionStatus.type === 'cellular') {
      return 'Cellular';
    } else if (connectionStatus.type === 'ethernet') {
      return 'Ethernet';
    } else {
      return 'Unknown';
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>Connection Status Monitor</Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Connection Type: </Text>
            {getConnectionTypeText()}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Is Connected: </Text>
            {connectionStatus.isConnected ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Internet Reachable: </Text>
            {connectionStatus.isInternetReachable === null 
              ? 'Unknown' 
              : connectionStatus.isInternetReachable ? 'Yes' : 'No'
            }
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.label}>WiFi Enabled: </Text>
            {connectionStatus.isWifiEnabled ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Cellular Enabled: </Text>
            {connectionStatus.isCellularEnabled ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {!isMonitoring ? (
            <Button
              mode="contained"
              onPress={startMonitoring}
              style={styles.button}
              icon="play-arrow"
            >
              Start Monitoring
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={stopMonitoring}
              style={styles.button}
              icon="stop"
            >
              Stop Monitoring
            </Button>
          )}
        </View>

        <View style={styles.testContainer}>
          <Text style={styles.testTitle}>Test Notifications:</Text>
          <View style={styles.testButtons}>
            <TouchableOpacity
              style={[styles.testButton, styles.offlineButton]}
              onPress={simulateOffline}
            >
              <MaterialIcons name="wifi-off" size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Simulate Offline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testButton, styles.onlineButton]}
              onPress={simulateOnline}
            >
              <MaterialIcons name="wifi" size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Simulate Online</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.instructions}>
          💡 To test real notifications: Turn off WiFi/mobile data, then turn it back on.
          Notifications will appear in the bottom-right corner.
        </Text>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
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
  detailsContainer: {
    marginBottom: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#000',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    marginVertical: 4,
  },
  testContainer: {
    marginBottom: 16,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  offlineButton: {
    backgroundColor: '#FF4C4C',
  },
  onlineButton: {
    backgroundColor: '#28A745',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  instructions: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ConnectionTestComponent;
