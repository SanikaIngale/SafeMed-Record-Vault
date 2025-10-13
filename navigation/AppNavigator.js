import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all screens
import ProfileScreen from '../screens/ProfileScreen';
import EditPersonalInfo from '../screens/EditPersonalInfo';
import EmergencyContacts from '../screens/EmergencyContacts';
import QRCodeScreen from '../screens/QRCodeScreen';
import AllergiesConditions from '../screens/AllergiesConditions';
import OngoingMedication from '../screens/OngoingMedication';
import VaccinationHistory from '../screens/VaccinationHistory';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Profile"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditPersonalInfo" component={EditPersonalInfo} />
        <Stack.Screen name="EmergencyContacts" component={EmergencyContacts} />
        <Stack.Screen name="QRCode" component={QRCodeScreen} />
        <Stack.Screen name="AllergiesConditions" component={AllergiesConditions} />
        <Stack.Screen name="OngoingMedication" component={OngoingMedication} />
        <Stack.Screen name="VaccinationHistory" component={VaccinationHistory} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;