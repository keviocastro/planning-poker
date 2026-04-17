import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { IntlProvider } from 'react-intl';
import HomeScreen from './src/screens/HomeScreen';
import RoomScreen from './src/screens/RoomScreen';
import SplashScreen from './src/screens/SplashScreen';
import { selectedMessages, deviceLanguage } from './src/utils/languages';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 3500);
  }, []);

  return (
    <IntlProvider locale={deviceLanguage} messages={selectedMessages} defaultLocale="en">
      {isLoading ? (
        <SplashScreen />
      ) : (
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Home"
            screenOptions={{
              headerShown: false
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Room" component={RoomScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </IntlProvider>
  );
}
