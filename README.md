# RideShare Lite

A React Native MVP for daily carpool matching based on route overlap and time windows.

## Features

- **Route Search**: Uses OpenRouteService API to calculate routes.
- **Real-time Matching**: Matches users if route overlap >60% and trip times within 15 minutes.
- **Map Visualization**: Displays calculated routes and matches.
- **Chat**: Real-time messaging between matched users via Firebase.
- **User Authentication**: JWT-based login/signup system.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure Firebase:
   - Replace `firebaseConfig` in `src/services/firebase.js` with your Firebase project credentials.

3. Configure OpenRouteService API:
   - Sign up at [OpenRouteService](https://openrouteservice.org/) to get an API key
   - Replace `YOUR_OPENROUTESERVICE_API_KEY` in `src/services/directions.js` with your API key

4. Run the app:
   ```
   npm start
   ```

## Authentication System

This project now includes a JWT-based authentication system with login and signup functionality.

### How it works

1. Users can sign up with email, password, and name
2. User credentials are stored in Firebase Firestore
3. Upon successful authentication, a JWT-like token is generated and stored securely using react-native-keychain
4. The token is used to authenticate subsequent requests
5. Users can log out to clear their session

### Screens

- **LoginScreen**: Allows existing users to log in with their credentials
- **SignupScreen**: Allows new users to create an account
- **HomeScreen**: Main app screen with logout functionality

### Services

- **authService**: Handles authentication logic including login, signup, and session management

## Core Concepts

### Matching Algorithm

Matching is based on:
- Route overlap percentage (>60%)
- Time window (within 15 minutes)
- Role complementarity (rider-driver pairs)

Tunable parameters in `src/services/matching.js`:
- `MATCH_THRESHOLD_KM`: 1.0 km
- `TIME_WINDOW_MINUTES`: 15
- `OVERLAP_THRESHOLD`: 0.6 (60%)

### Architecture

- `src/components/`: UI components like MapComponent
- `src/screens/`: App screens (ChatScreen, HomeScreen, LoginScreen, SignupScreen)
- `src/services/`: Backend logic (Firebase, Directions, Matching, Auth)
- `App.js`: Main entry point with navigation

## Available Scripts

- `npm start`: Start development server (`npx expo start`)
- `npm run android`: Launch on Android emulator
- `npm run ios`: Launch on iOS simulator
- `npm run web`: Run on web
- `npm run test`: Run Jest tests