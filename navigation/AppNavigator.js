import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Ekranları import et
import AddEventScreen from '../screens/AddEventScreen';
import AddProjectScreen from '../screens/AddProjectScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ChatScreen from '../screens/ChatScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import FocusScreen from '../screens/FocusScreen';
import HomeScreen from '../screens/HomeScreen';
import JournalDetailScreen from '../screens/JournalDetailScreen';
import JournalScreen from '../screens/JournalScreen';
import LoginScreen from '../screens/LoginScreen';
import NotesDetailScreen from '../screens/NotesDetailScreen';
import NotesScreen from '../screens/NotesScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import ProjectScreen from '../screens/ProjectScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import TodoDetailScreen from '../screens/TodoDetailScreen';
import WaterTrackerScreen from '../screens/WaterTrackerScreen';

// Custom Tab Bar bileşenimizi import et
import BottomTabBar from '../components/BottomTabBar';
import { useAuth } from '../context/AuthContext';

// Stack Navigator
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Projeler stack navigator
function ProjectsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProjectsList" component={ProjectScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="AddProject" component={AddProjectScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
    </Stack.Navigator>
  );
}

// Takvim stack navigator
function CalendarStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CalendarMain" component={CalendarScreen} />
      <Stack.Screen name="AddTask" component={AddTaskScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="TodoDetail" component={TodoDetailScreen} />
    </Stack.Navigator>
  );
}

// Ana ekranlar için Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarStack} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Focus" component={FocusScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth Stack (Giriş ve Kayıt)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Ana Navigator
export default function AppNavigator() {
  const { user } = useAuth();
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Projects" component={ProjectsStack} />
            <Stack.Screen name="WaterTracker" component={WaterTrackerScreen} />
            <Stack.Screen name="Notes" component={NotesScreen} />
            <Stack.Screen name="NotesDetail" component={NotesDetailScreen} />
            <Stack.Screen name="Journal" component={JournalScreen} />
            <Stack.Screen name="JournalDetail" component={JournalDetailScreen} />
            <Stack.Screen name="Statistics" component={StatisticsScreen} />
            <Stack.Screen name="AddTask" component={AddTaskScreen} />
            <Stack.Screen name="AddEvent" component={AddEventScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="TodoDetail" component={TodoDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 