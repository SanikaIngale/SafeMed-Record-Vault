import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

import AllergiesConditions from '../src/screens/AllergiesConditions';
import ConsultationHistoryScreen from '../src/screens/ConsultationHistoryScreen';
import EditPersonalInfo from '../src/screens/EditPersonalInfo';
import EmergencyContacts from '../src/screens/EmergencyContacts';
import HomePage from '../src/screens/Homepage';
import OngoingMedication from '../src/screens/OngoingMedication';
import ProfileDetailsScreen from '../src/screens/ProfileDetailsScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import RequestScreen from '../src/screens/RequestScreen';
import SignInScreen from '../src/screens/signin';
import SignUpScreen from '../src/screens/signup';
import VaccinationHistory from '../src/screens/VaccinationHistory';
import VisitSummaryScreen from '../src/screens/VisitSummaryScreen';


const Stack = createNativeStackNavigator();

export const AuthContext = React.createContext();

const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCredentials, setUserCredentials] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Always start unauthenticated - show SignIn every time app opens
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        setIsAuthenticated(false);
      } catch (e) {
        console.error('Failed to restore token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    signIn: async (credentials) => {
      setIsAuthenticated(true);
      setUserCredentials(credentials);
    },
    signOut: async () => {
      try {
        // Clear all AsyncStorage data
        await AsyncStorage.multiRemove([
          'userToken',
          'userData',
          'userEmail',
          'patient_id',
          'userPhone',
          'userName',
          'userDemographics',
          'isNewUser',
        ]);
      } catch (e) {
        console.error('Failed to clear storage on logout', e);
      }
      setIsAuthenticated(false);
      setUserCredentials(null);
    },
    signUp: async (credentials) => {
      setIsAuthenticated(true);
      setUserCredentials(credentials);
    },
  };

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {isLoading ? (
            // Loading screen
            <Stack.Screen
              name="Loading"
              component={() => null}
              options={{ animationEnabled: false }}
            />
          ) : !isAuthenticated ? (
            <>
              <Stack.Screen 
                name="SignIn" 
                component={SignInScreen}
                initialParams={{ setIsAuthenticated, setUserCredentials }}
                options={{ animationEnabled: false }}
              />
              <Stack.Screen 
                name="SignUp" 
                component={SignUpScreen}
                initialParams={{ setIsAuthenticated, userCredentials }}
              />
              <Stack.Screen 
                name="ProfileDetails" 
                component={ProfileDetailsScreen}
                options={{ gestureEnabled: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Homepage" component={HomePage} options={{ animationEnabled: false }} /> 
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="EditPersonalInfo" component={EditPersonalInfo} />
              <Stack.Screen name="EmergencyContacts" component={EmergencyContacts} />
              <Stack.Screen name="AllergiesConditions" component={AllergiesConditions} />
              <Stack.Screen name="OngoingMedication" component={OngoingMedication} />
              <Stack.Screen name="VaccinationHistory" component={VaccinationHistory} />
              <Stack.Screen name="Request" component={RequestScreen} />
              <Stack.Screen name="ConsultationHistory" component={ConsultationHistoryScreen} />
              <Stack.Screen name="VisitSummary" component={VisitSummaryScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default AppNavigator;