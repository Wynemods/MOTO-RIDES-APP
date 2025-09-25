import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import ConnectionNotificationTester from '../components/ConnectionNotificationTester';

export default function ProfileScreen() {
  const [isLightMode, setIsLightMode] = useState(false);

  const profileOptions = [
    {
      id: 1,
      title: 'Light Mode',
      icon: 'wb-sunny',
      hasToggle: true,
      toggleValue: isLightMode,
      onToggle: setIsLightMode,
    },
    {
      id: 2,
      title: 'Payment Methods',
      icon: 'credit-card',
      hasArrow: true,
    },
    {
      id: 3,
      title: 'Saved Locations',
      icon: 'favorite-border',
      hasArrow: true,
    },
    {
      id: 4,
      title: 'Emergency Contacts',
      icon: 'security',
      hasArrow: true,
      hasBadge: true,
      badgeText: 'New',
    },
    {
      id: 5,
      title: 'Notifications',
      icon: 'notifications',
      hasArrow: true,
    },
    {
      id: 6,
      title: 'Become a Driver',
      icon: 'drive-eta',
      hasButton: true,
      buttonText: 'Earn More',
    },
    {
      id: 7,
      title: 'Help & Support',
      icon: 'help',
      hasArrow: true,
    },
    {
      id: 8,
      title: 'Settings',
      icon: 'settings',
      hasArrow: true,
    },
    {
      id: 9,
      title: 'Log Out',
      icon: 'logout',
      isDestructive: true,
    },
  ];

  const handleOptionPress = (option: any) => {
    // TODO: Handle option press
    console.log('Option pressed:', option.title);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={24} color="#666" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.userPhone}>+1 (555) 123-4567</Text>
          </View>
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rating</Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.statValue}>4.8</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Rides</Text>
              <Text style={styles.statValue}>47</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Member Since</Text>
              <Text style={styles.statValue}>May 2023</Text>
            </View>
          </Card.Content>
        </Card>
      </LinearGradient>

      {/* Content Area */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Notification Tester */}
        <ConnectionNotificationTester />
        
        {profileOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleOptionPress(option)}
            style={styles.optionContainer}
          >
            <Card style={styles.optionCard}>
              <Card.Content style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <MaterialIcons 
                    name={option.icon as any} 
                    size={20} 
                    color={option.isDestructive ? '#F44336' : '#666'} 
                  />
                  <Text style={[
                    styles.optionText,
                    option.isDestructive && styles.destructiveText
                  ]}>
                    {option.title}
                  </Text>
                </View>
                
                <View style={styles.optionRight}>
                  {option.hasToggle && (
                    <Switch
                      value={option.toggleValue}
                      onValueChange={option.onToggle}
                      trackColor={{ false: '#ccc', true: '#00FF00' }}
                      thumbColor={option.toggleValue ? '#000' : '#fff'}
                    />
                  )}
                  
                  {option.hasBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{option.badgeText}</Text>
                    </View>
                  )}
                  
                  {option.hasButton && (
                    <Button
                      mode="contained"
                      style={styles.earnMoreButton}
                      labelStyle={styles.earnMoreText}
                    >
                      {option.buttonText}
                    </Button>
                  )}
                  
                  {option.hasArrow && (
                    <MaterialIcons name="chevron-right" size={20} color="#666" />
                  )}
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#cccccc',
  },
  statsCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  statsContent: {
    flexDirection: 'row',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#444444',
    marginHorizontal: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionContainer: {
    marginBottom: 10,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  destructiveText: {
    color: '#F44336',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  earnMoreButton: {
    backgroundColor: '#666666',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  earnMoreText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
