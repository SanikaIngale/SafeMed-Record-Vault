import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import authentication screens
import SignInScreen from '../screens/signin';
import SignUpScreen from '../screens/signup';
import OTPVerificationScreen from '../screens/otp';

// Import main screens
import ProfileScreen from '../screens/ProfileScreen';
import EditPersonalInfo from '../screens/EditPersonalInfo';
import EmergencyContacts from '../screens/EmergencyContacts';
import QRCodeScreen from '../screens/QRCodeScreen';
import AllergiesConditions from '../screens/AllergiesConditions';
import OngoingMedication from '../screens/OngoingMedication';
import VaccinationHistory from '../screens/VaccinationHistory';
import RequestScreen from '../screens/RequestScreen';
import ConsultationHistoryScreen from '../screens/ConsultationHistoryScreen';
import VisitSummaryScreen from '../screens/VisitSummaryScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCredentials, setUserCredentials] = useState(null);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Profile" : "SignIn"}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen 
              name="SignIn" 
              component={SignInScreen}
              initialParams={{ setIsAuthenticated, setUserCredentials }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen}
              initialParams={{ setIsAuthenticated, userCredentials }}
            />
            <Stack.Screen 
              name="OTP" 
              component={OTPVerificationScreen}
              initialParams={{ setIsAuthenticated }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditPersonalInfo" component={EditPersonalInfo} />
            <Stack.Screen name="EmergencyContacts" component={EmergencyContacts} />
            <Stack.Screen name="QRCode" component={QRCodeScreen} />
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
  );
};

export default AppNavigator;