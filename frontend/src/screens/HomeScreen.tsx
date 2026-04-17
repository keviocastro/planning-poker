import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useIntl } from 'react-intl';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Home: undefined;
  Room: { roomId: string; userName: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const intl = useIntl();
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('user_name');
      if (savedName) setUserName(savedName);

      // Check if user was previously in a room (for web F5 support)
      if (Platform.OS === 'web') {
        const lastRoom = await AsyncStorage.getItem('last_room_id');
        if (lastRoom && savedName) {
          navigation.navigate('Room', { roomId: lastRoom, userName: savedName });
        }
      }
    } catch (e) {
      console.error('Failed to load saved data', e);
    }
  };

  const handleJoin = async () => {
    if (!userName.trim()) {
      Alert.alert(intl.formatMessage({ id: 'home.nameError' }));
      return;
    }
    
    try {
      const finalRoomId = roomId.trim() || Math.random().toString(36).substring(7).toUpperCase();
      await AsyncStorage.setItem('user_name', userName.trim());
      await AsyncStorage.setItem('last_room_id', finalRoomId);
      navigation.navigate('Room', { roomId: finalRoomId, userName: userName.trim() });
    } catch (e) {
      console.error('Failed to save session', e);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{intl.formatMessage({ id: 'home.title' })}</Text>
        <Text style={styles.subtitle}>{intl.formatMessage({ id: 'home.subtitle' })}</Text>

        <TextInput
          style={styles.input}
          placeholder={intl.formatMessage({ id: 'home.namePlaceholder' })}
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder={intl.formatMessage({ id: 'home.roomPlaceholder' })}
          value={roomId}
          onChangeText={setRoomId}
          autoCapitalize="characters"
        />

        <TouchableOpacity style={styles.button} onPress={handleJoin}>
          <Text style={styles.buttonText}>{intl.formatMessage({ id: 'home.joinButton' })}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
