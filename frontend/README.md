# Collaborative Planning Poker

A real-time, collaborative Planning Poker application built with React Native (Expo) and Node.js. Designed for agile teams to estimate story points and bug complexity seamlessly.

## 🚀 Features
- **Real-time collaboration**: Powered by Socket.io for instant updates.
- **Fibonacci Scale**: Standard agile estimation cards (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕).
- **Anonymous Sessions**: Join or create rooms instantly with just a name and Room ID.
- **Reveal & Reset**: Synchronized controls to reveal votes or start new rounds.
- **Cross-Platform**: Works on Android, iOS (via Expo Go), and Web.

---

## 🛠 Tech Stack
- **Frontend**: React Native, Expo, TypeScript, React Navigation, Lucide Icons.
- **Backend**: Node.js, Express, Socket.io.

---

## 🏃 Getting Started

### 1. Prerequisites
- Node.js installed on your machine.
- [Expo Go](https://expo.dev/expo-go) app installed on your mobile device (for testing on mobile).

### 2. Backend Setup
```bash
cd planning-poker-server
npm install
npm start
```
The server starts on port `4000` by default.

### 3. Frontend Setup
1. **Configure IP Address**: 
   Open `src/utils/socket.ts` and update `SERVER_URL` with your local machine's IP address:
   ```typescript
   const SERVER_URL = 'http://YOUR_LOCAL_IP:4000';
   ```
2. **Install & Run**:
   ```bash
   cd planning-poker-app
   npm install
   npx expo start
   ```

---

## 📱 How to Use
1. **Join**: Enter your display name and a Room ID (e.g., "TEAM-A").
2. **Vote**: Tap on a card to cast your vote. You'll see a checkmark next to your name once voted.
3. **Reveal**: Once everyone has voted, anyone can tap "Reveal Votes" to see the results.
4. **Reset**: Tap "Reset" to clear all votes and start a new estimation round.

---

## 📂 Project Structure
- `planning-poker-server/`: Node.js backend logic and Socket.io events.
## 🌍 Localization
The app automatically detects your device language.
- **Portuguese (Brazil)**: Default for Brazilian users.
- **English**: Fallback for all other regions.
Supported by `react-intl` and `expo-localization`.
