import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ConnectionService from '../services/connection.service';

interface NetworkErrorHandlerProps {
  onRetry: () => void;
  onOfflineMode: () => void;
}

export default function NetworkErrorHandler({
  onRetry,
  onOfflineMode,
}: NetworkErrorHandlerProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showOfflineMode, setShowOfflineMode] = useState(false);

  useEffect(() => {
    // Get initial connection status
    const initialStatus = ConnectionService.getConnectionStatus();
    setIsConnected(initialStatus.isConnected);

    // Listen for connection changes
    const handleConnectionChange = (status: any) => {
      setIsConnected(status.isConnected);
      
      if (status.isConnected && !isConnected) {
        // Connection restored - notification will be handled by ConnectionStatusNotification
        setRetryCount(0);
      }
    };

    ConnectionService.onConnectionChange(handleConnectionChange);

    return () => {
      ConnectionService.offConnectionChange(handleConnectionChange);
    };
  }, [isConnected]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await onRetry();
      setIsRetrying(false);
    } catch (error) {
      setIsRetrying(false);
      
      if (retryCount >= 3) {
        setShowOfflineMode(true);
      }
    }
  };

  const handleOfflineMode = () => {
    setShowOfflineMode(false);
    onOfflineMode();
  };

  if (isConnected) {
    return null;
  }

  return (
    <Card style={styles.errorCard}>
      <Card.Content>
        <View style={styles.errorHeader}>
          <MaterialIcons name="wifi-off" size={24} color="#F44336" />
          <Text style={styles.errorTitle}>No Internet Connection</Text>
        </View>
        
        <Text style={styles.errorMessage}>
          Unable to connect to the server. Please check your internet connection.
        </Text>

        <View style={styles.errorActions}>
          <Button
            mode="outlined"
            onPress={handleRetry}
            loading={isRetrying}
            disabled={isRetrying}
            style={styles.retryButton}
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
          
          {retryCount >= 3 && (
            <Button
              mode="contained"
              onPress={handleOfflineMode}
              style={styles.offlineButton}
            >
              Offline Mode
            </Button>
          )}
        </View>

        {retryCount > 0 && (
          <Text style={styles.retryCount}>
            Retry attempts: {retryCount}/3
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    margin: 10,
    backgroundColor: '#FF4C4C',
    borderLeftWidth: 4,
    borderLeftColor: '#FF4C4C',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
  },
  errorMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 15,
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  retryButton: {
    flex: 1,
    marginRight: 5,
  },
  offlineButton: {
    flex: 1,
    marginLeft: 5,
  },
  retryCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
});
