import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import ActivityScreen from './activity';
import AllergiesScreen from './allergies';
import CameraPermissionScreen from './camera-permission';
import HealthInfoScreen from './health-info';
import HydrationScreen from './hydration';
import LoadingScreen from './loading-screen';
import LocationPermissionScreen from './location-permission';
import MicrophonePermissionScreen from './microphone-permission';
import RegistrationComplete from './registration-complete';

const Stack = createStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false,
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }} 
      initialRouteName="RegistrationComplete"
    >
      <Stack.Screen name="RegistrationComplete" component={RegistrationComplete} />
      <Stack.Screen name="HealthInfo" component={HealthInfoScreen} />
      <Stack.Screen name="Activity" component={ActivityScreen} />
      <Stack.Screen name="Allergies" component={AllergiesScreen} />
      <Stack.Screen name="Hydration" component={HydrationScreen} />
      <Stack.Screen name="CameraPermission" component={CameraPermissionScreen} />
      <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      <Stack.Screen name="MicrophonePermission" component={MicrophonePermissionScreen} />
      <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
    </Stack.Navigator>
  );
} 