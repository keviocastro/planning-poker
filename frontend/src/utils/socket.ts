import { io } from 'socket.io-client';

// Change this to your server IP address if testing on a physical device
const SERVER_URL = 'http://192.168.157.140:4000';

export const socket = io(SERVER_URL, {
  autoConnect: false,
});
