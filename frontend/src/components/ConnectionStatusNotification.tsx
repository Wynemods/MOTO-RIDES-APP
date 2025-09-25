import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ConnectionService from '../services/connection.service';

const { width, height } = Dimensions.get('window');

interface ConnectionNotification {
  id: string;
  type: 'offline' | 'online';
  message: string;
  duration: number;
}

const ConnectionStatusNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<ConnectionNotification[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const notificationRefs = useRef<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    // Listen for offline events
    const handleOffline = () => {
      const notification: ConnectionNotification = {
        id: `offline-${Date.now()}`,
        type: 'offline',
        message: '⚠️ Connection lost. Please check your internet.',
        duration: 3000,
      };
      showNotification(notification);
    };

    // Listen for online events
    const handleOnline = () => {
      const notification: ConnectionNotification = {
        id: `online-${Date.now()}`,
        type: 'online',
        message: '✅ Back online',
        duration: 2000,
      };
      showNotification(notification);
    };

    // Add event listeners
    ConnectionService.onOffline(handleOffline);
    ConnectionService.onOnline(handleOnline);

    // Cleanup
    return () => {
      ConnectionService.offOffline(handleOffline);
      ConnectionService.offOnline(handleOnline);
    };
  }, []);

  const showNotification = (notification: ConnectionNotification) => {
    // Create animation values for this notification
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(50);
    
    notificationRefs.current[notification.id] = fadeAnim;

    // Add notification to state
    setNotifications(prev => [...prev, notification]);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    setTimeout(() => {
      dismissNotification(notification.id, fadeAnim, slideAnim);
    }, notification.duration);
  };

  const dismissNotification = (id: string, fadeAnim: Animated.Value, slideAnim: Animated.Value) => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove from state
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      // Clean up animation refs
      delete notificationRefs.current[id];
    });
  };

  const handleManualDismiss = (notification: ConnectionNotification) => {
    const fadeAnim = notificationRefs.current[notification.id];
    const slideAnim = new Animated.Value(0); // Already at 0 position
    
    if (fadeAnim) {
      dismissNotification(notification.id, fadeAnim, slideAnim);
    }
  };

  const getNotificationStyles = (type: 'offline' | 'online') => {
    switch (type) {
      case 'offline':
        return {
          container: styles.offlineContainer,
          icon: 'wifi-off',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
      case 'online':
        return {
          container: styles.onlineContainer,
          icon: 'wifi',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
      default:
        return {
          container: styles.onlineContainer,
          icon: 'wifi',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {notifications.map((notification) => {
        const styles = getNotificationStyles(notification.type);
        const fadeAnim = notificationRefs.current[notification.id] || new Animated.Value(1);
        const slideAnim = new Animated.Value(0);

        return (
          <Animated.View
            key={notification.id}
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name={styles.icon as any}
                  size={20}
                  color={styles.iconColor}
                />
              </View>
              
              <Text style={[styles.message, { color: styles.textColor }]}>
                {notification.message}
              </Text>

              <TouchableOpacity
                onPress={() => handleManualDismiss(notification)}
                style={styles.closeButton}
              >
                <MaterialIcons
                  name="close"
                  size={16}
                  color={styles.textColor}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100, // Adjust for iOS safe area
    right: 16,
    left: 16,
    zIndex: 1001, // Higher than other notifications
    pointerEvents: 'box-none', // Allow touches to pass through to underlying components
    maxWidth: width - 32, // Ensure it doesn't exceed screen width
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    minHeight: 48,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  
  // Offline notification styles
  offlineContainer: {
    backgroundColor: '#FF4C4C',
    marginBottom: 8,
  },
  
  // Online notification styles
  onlineContainer: {
    backgroundColor: '#28A745',
    marginBottom: 8,
  },
});

export default ConnectionStatusNotification;
