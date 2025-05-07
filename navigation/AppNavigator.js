import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Easing, View } from 'react-native';
import { createSharedElementStackNavigator } from 'react-navigation-shared-element';

// Ekranları import et
import AddEventScreen from '../screens/AddEventScreen';
import AddProjectScreen from '../screens/AddProjectScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CalendarStatistics from '../screens/CalendarStatistics';
import ChatScreen from '../screens/ChatScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import FocusScreenWrapper from '../screens/FocusScreen';
import HomeScreen from '../screens/HomeScreen';
import JournalDetailScreen from '../screens/JournalDetailScreen';
import JournalScreen from '../screens/JournalScreen';
import LoginScreen from '../screens/LoginScreen';
import NotesDetailScreen from '../screens/NotesDetailScreen';
import NotesScreen from '../screens/NotesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import ProjectScreen from '../screens/ProjectScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import TodoDetailScreen from '../screens/TodoDetailScreen';
import WaterTrackerScreen from '../screens/WaterTrackerScreen';

// AI Screen import et
import AiMainScreen from '../app/ai/index';

// Custom Tab Bar bileşenimizi import et
import BottomTabBar from '../components/BottomTabBar';
import { useAuth } from '../context/AuthContext';

// Stack Navigator
const Stack = createNativeStackNavigator();
const SharedElementStack = createSharedElementStackNavigator();
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

// Takvim stack navigator - Shared Element geçişleri ile
function CalendarStack() {
  // Özel geçiş konfigürasyonu
  const transitionSpec = {
    open: {
      animation: 'timing',
      config: {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    },
  };

  // Özel cardStyleInterpolator
  const cardStyleInterpolator = ({ current, next, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.8, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  };

  return (
    <SharedElementStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        transitionSpec,
        cardStyleInterpolator,
        cardOverlayEnabled: true,
      }}
    >
      <SharedElementStack.Screen name="CalendarMain" component={CalendarScreen} />
      <SharedElementStack.Screen name="AddTask" component={AddTaskScreen} />
      <SharedElementStack.Screen name="AddEvent" component={AddEventScreen} />
      <SharedElementStack.Screen 
        name="EventDetail" 
        component={EventDetailScreen}
        sharedElements={(route) => {
          const { event } = route.params;
          return [`event.${event.id}.card`];
        }}
      />
      <SharedElementStack.Screen 
        name="TodoDetail" 
        component={TodoDetailScreen}
        sharedElements={(route) => {
          const { todo } = route.params;
          return [`todo.${todo.id}.card`];
        }}
      />
      <SharedElementStack.Screen name="CalendarStatistics" component={CalendarStatistics} />
    </SharedElementStack.Navigator>
  );
}

// Ana ekranlar için Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => {
        // Eğer Calendar stack'inde AddTask veya AddEvent ekranındaysak, tabbar'ı gizle
        const { state } = props.navigation;
        if (state) {
          const route = state.routes[state.index];
          if (route.name === 'Calendar') {
            // CalendarStack'in aktif ekranını kontrol et
            const calendarRoute = route.state?.routes?.[route.state.index];
            if (calendarRoute && (calendarRoute.name === 'AddTask' || calendarRoute.name === 'AddEvent')) {
              return null; // TabBar'ı tamamen gizle
            }
          }
          // Focus ekranı için de gizle
          if (route.name === 'Focus') {
            return null;
          }
        }
        return <BottomTabBar {...props} />;
      }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarStack}
      />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Focus" component={FocusScreenWrapper} />
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

// Özel tema
const forsteTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#333333',
    border: '#F0F0F0',
    primary: '#7E57C2',
  },
};

// Ana Navigator
export default function AppNavigator() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userState, setUserState] = useState(null);
  
  // useAuth hook'unu try-catch bloğu içinde çağır
  let authContext = null;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('useAuth hook hatası:', error);
  }

  useEffect(() => {
    // authContext null değilse ve isReady true ise
    if (authContext && authContext.isReady) {
      setIsAuthReady(true);
      setUserState(authContext.user);
    }
  }, [authContext]);

  // Auth durumu hazır değilse yükleniyor göster
  if (!isAuthReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7E57C2" />
      </View>
    );
  }
  
  return (
    <NavigationContainer theme={forsteTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        {userState ? (
          <>
            <Stack.Screen 
              name="Main" 
              component={TabNavigator} 
              options={{
                animation: 'fade',
              }}
            />
            <Stack.Screen 
              name="Projects" 
              component={ProjectsStack}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="WaterTracker" 
              component={WaterTrackerScreen} 
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="Notes" 
              component={NotesScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="NotesDetail" 
              component={NotesDetailScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="Journal" 
              component={JournalScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="JournalDetail" 
              component={JournalDetailScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            />
            <Stack.Screen 
              name="Statistics" 
              component={StatisticsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="TodoDetail" 
              component={TodoDetailScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="EventDetail" 
              component={EventDetailScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="ai" 
              component={AiMainScreen} 
              options={{
                presentation: 'card',
                animationTypeForReplace: 'push',
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen}
              options={{
                animation: 'fade',
              }}
            />
            <Stack.Screen 
              name="Auth" 
              component={AuthStack}
              options={{
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 