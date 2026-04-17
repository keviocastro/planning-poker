# 🃏 Planning Poker Collaborative

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-v0.7x-blue.svg)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.x-black.svg)](https://socket.io/)

A modern, real-time, collaborative Planning Poker application designed for agile teams. Estimate story points and bugs seamlessly with your team across Web, Android, and iOS. Featuring deep **Jira Integration** for automated workflow synchronization.

---

## ✨ Features

- **🚀 Real-Time Collaboration**: Instant synchronization powered by Socket.io.
- **📊 Fibonacci Scaling**: Standard Agile estimation cards (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕).
- **🔗 Jira Integration**:
  - Automatically fetch issue titles using issue keys (e.g., *PROJ-123*).
  - List and select custom estimate fields (Story Points, Complexity, etc.).
  - **Auto-Sync**: Automatically update the Jira issue field when the estimate is confirmed.
  - Direct links to open tickets in Jira from the app and session history.
- **📜 Session History**: Keep track of every story estimated during the session in a persistent log.
- **🌍 Multi-language Support**: Automatically detects device language (Portuguese and English supported).
- **🔄 Session Persistence**: Intelligent auto-reconnect on browser refresh (F5 support).
- **📱 Cross-Platform**: Optimized for Web browsers and Mobile devices (Expo).

---

## 🛠 Tech Stack

- **Frontend**: React Native, Expo, TypeScript, React Navigation, Lucide Icons, React Intl.
- **Backend**: Node.js, Express, Socket.io, Axios.
- **Persistence**: AsyncStorage (Web/Mobile).

---

## 🏃 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [Expo Go](https://expo.dev/expo-go) (for mobile testing)

### 2. Installation
Clone the repository:
```bash
git clone git@github.com:keviocastro/planning-poker.git
cd planning-poker
```

### 3. Backend Setup
```bash
cd backend
npm install
npm start
```
The server will start on `http://localhost:4000`.

### 4. Frontend Setup
```bash
cd frontend
npm install
npx expo start
```
- Press **'w'** to run in your browser.
- Scan the QR code with **Expo Go** to run on Android/iOS.

*Note: If testing on physical mobile devices, update the `SERVER_URL` in `frontend/src/utils/socket.ts` to your machine's local IP address.*

---

## ⚙️ Jira Configuration

To enable Jira sync:
1. Click the **Settings (Gear Icon)** in any room.
2. Enter your **Jira Domain** (e.g., `yourcompany.atlassian.net`).
3. Enter your **Account Email** and **API Token** ([Generate here](https://id.atlassian.com/manage-profile/security/api-tokens)).
4. Click **"Fetch Project Fields"** and select which field should receive the Story Points.
5. Save settings.

Now, whenever you estimate a story that starts with an issue key, you can sync it with one click!

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via Issues.
- Propose new features.
- Submit Pull Requests.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Developed with ❤️ for agile teams everywhere.
