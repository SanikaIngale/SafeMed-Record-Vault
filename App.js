import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import OTPVerificationScreen from './screens/otp';
import SignInScreen from './screens/signin';
import SignUpScreen from './screens/signup';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('signin');
  const [userCredentials, setUserCredentials] = useState({
    email: '',
    password: ''
  });

  const renderScreen = () => {
    switch(currentScreen) {
      case 'signin':
        return <SignInScreen setCurrentScreen={setCurrentScreen} setUserCredentials={setUserCredentials} />;
      case 'signup':
        return <SignUpScreen setCurrentScreen={setCurrentScreen} userCredentials={userCredentials} />;
      case 'otp':
        return <OTPVerificationScreen setCurrentScreen={setCurrentScreen} />;
      default:
        return <SignInScreen setCurrentScreen={setCurrentScreen} setUserCredentials={setUserCredentials} />;
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      {renderScreen()}
    </>
  );
}