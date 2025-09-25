import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type NotificationType = 'error' | 'warning' | 'success' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemoveNotification,
}) => {
  return (
    <View style={styles.container}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => onRemoveNotification(notification.id)}
        />
      ))}
    </View>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Slide in animation
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
    const timer = setTimeout(() => {
      handleClose();
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove();
    });
  };

  const getNotificationStyles = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return {
          container: styles.errorContainer,
          icon: 'error',
          iconColor: '#FFFFFF',
          title: styles.errorTitle,
          message: styles.errorMessage,
        };
      case 'warning':
        return {
          container: styles.warningContainer,
          icon: 'warning',
          iconColor: '#000000',
          title: styles.warningTitle,
          message: styles.warningMessage,
        };
      case 'success':
        return {
          container: styles.successContainer,
          icon: 'check-circle',
          iconColor: '#FFFFFF',
          title: styles.successTitle,
          message: styles.successMessage,
        };
      case 'info':
        return {
          container: styles.infoContainer,
          icon: 'info',
          iconColor: '#FFFFFF',
          title: styles.infoTitle,
          message: styles.infoMessage,
        };
      default:
        return {
          container: styles.infoContainer,
          icon: 'info',
          iconColor: '#FFFFFF',
          title: styles.infoTitle,
          message: styles.infoMessage,
        };
    }
  };

  const styles = getNotificationStyles(notification.type);

  return (
    <Animated.View
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
            size={24}
            color={styles.iconColor}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message}>{notification.message}</Text>
        </View>

        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={20} color={styles.iconColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  
  // Error styles
  errorContainer: {
    backgroundColor: '#FF4C4C',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  errorMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  
  // Warning styles
  warningContainer: {
    backgroundColor: '#FFA500',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  warningMessage: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  
  // Success styles
  successContainer: {
    backgroundColor: '#28A745',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  successMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  
  // Info styles
  infoContainer: {
    backgroundColor: '#17A2B8',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  infoMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
});

export default NotificationSystem;
