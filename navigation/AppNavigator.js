import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';

// Update ALL imports to use ../src/screens/ instead of ../screens/
import AllergiesConditions from '../src/screens/AllergiesConditions';
import ConsultationHistoryScreen from '../src/screens/ConsultationHistoryScreen';
import EditPersonalInfo from '../src/screens/EditPersonalInfo';
import EmergencyContacts from '../src/screens/EmergencyContacts';
import OngoingMedication from '../src/screens/OngoingMedication';
import OTPVerificationScreen from '../src/screens/otp';
import ProfileScreen from '../src/screens/ProfileScreen';
import QRCodeScreen from '../src/screens/QRCodeScreen';
import RequestScreen from '../src/screens/RequestScreen';
import SignInScreen from '../src/screens/signin';
import SignUpScreen from '../src/screens/signup';
import VaccinationHistory from '../src/screens/VaccinationHistory';
import VisitSummaryScreen from '../src/screens/VisitSummaryScreen';


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