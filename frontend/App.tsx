import React, { useMemo, useCallback, Suspense, lazy, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { enableScreens } from 'react-native-screens';
import { LocationProvider } from './src/contexts/LocationContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { RidesProvider } from './src/contexts/RidesContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { useNotification } from './src/contexts/NotificationContext';
const NotificationSystem = lazy(() => import('./src/components/NotificationSystem'));
import ConnectionStatusNotification from './src/components/ConnectionStatusNotification';
import 'react-native-gesture-handler';

// Lazy-load screens
const WelcomeScreen = lazy(() => import('./src/screens/WelcomeScreen'));
const LoginScreen = lazy(() => import('./src/screens/LoginScreen'));
const RegisterScreen = lazy(() => import('./src/screens/RegisterScreen'));
const HomeScreen = lazy(() => import('./src/screens/HomeScreen'));
const RidesScreen = lazy(() => import('./src/screens/RidesScreen'));
const DriveScreen = lazy(() => import('./src/screens/DriveScreen'));
const WalletScreen = lazy(() => import('./src/screens/WalletScreen'));
const ProfileScreen = lazy(() => import('./src/screens/ProfileScreen'));

// Import theme
import { theme } from './src/theme/theme';

enableScreens(true);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

function DeferredNotifications() {
  const { notifications, removeNotification } = useNotification();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </Suspense>
  );
}

// Main Tab Navigator for authenticated users
function MainTabNavigator() {
  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingVertical: 5,
      },
      headerShown: false,
      lazy: true,
      freezeOnBlur: true,
      detachInactiveScreens: true,
    }),
    []
  );

  const renderIcon = useCallback(({ route, color, size }: any) => {
    let iconName: keyof typeof MaterialIcons.glyphMap | undefined;
    if (route.name === 'Home') iconName = 'home';
    else if (route.name === 'Rides') iconName = 'schedule';
    else if (route.name === 'Drive') iconName = 'drive-eta';
    else if (route.name === 'Wallet') iconName = 'account-balance-wallet';
    else if (route.name === 'Profile') iconName = 'person';
    return <MaterialIcons name={iconName as any} size={size} color={color} />;
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          ...screenOptions,
          tabBarIcon: ({ color, size }) => renderIcon({ route, color, size }),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Rides" component={RidesScreen} />
        <Tab.Screen name="Drive" component={DriveScreen} />
        <Tab.Screen name="Wallet" component={WalletScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <NotificationProvider>
          <AuthProvider>
            <LocationProvider>
              <RidesProvider>
                <NavigationContainer>
                  <StatusBar style="light" backgroundColor="#000" />
                  <DeferredNotifications />
                  <ConnectionStatusNotification />
                  <Suspense fallback={<View style={{ flex: 1, backgroundColor: '#000' }} />}> 
                    <Stack.Navigator
                      initialRouteName="Welcome"
                      screenOptions={{
                        headerStyle: {
                          backgroundColor: '#000',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                          fontWeight: 'bold',
                          fontSize: 18,
                        },
                      }}
                    >
                      <Stack.Screen
                        name="Welcome"
                        component={WelcomeScreen}
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ title: 'Sign In' }}
                      />
                      <Stack.Screen
                        name="Register"
                        component={RegisterScreen}
                        options={{ title: 'Create Account' }}
                      />
                      <Stack.Screen
                        name="MainTabs"
                        component={MainTabNavigator}
                        options={{ headerShown: false }}
                      />
                    </Stack.Navigator>
                  </Suspense>
                </NavigationContainer>
              </RidesProvider>
            </LocationProvider>
          </AuthProvider>
        </NotificationProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
