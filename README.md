# ENGEAR GESTAO COMERCIAL

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/pastaengear-firebase/ENGEAR-GESTAO-COMERCIAL.git
   cd ENGEAR-GESTAO-COMERCIAL
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Firebase Configuration Steps
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Add a web application to your project.
3. Copy the Firebase configuration object and add it to your project:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```
4. Initialize Firebase in your application:
   ```javascript
   import { initializeApp } from "firebase/app";
   const app = initializeApp(firebaseConfig);
   ```

## Deployment Guide
1. Build your application:
   ```bash
   npm run build
   ```
2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy
   ```

## Additional Notes
- Ensure you have the Firebase CLI installed.
- You can install it via npm:
  ```bash
  npm install -g firebase-tools
  ```

- Make sure to set the appropriate security rules for your Firebase project accordingly.
