# 🚗 SafarSathi Mobile Application

SafarSathi is a premium, real-time university carpooling mobile application designed to simplify campus commutes. Built with **React Native, Expo, and TypeScript**, the mobile application delivers a highly visual, high-performance interface for searching, hosting, tracking, and coordinating rides.

---

## ✨ Key Features

### 1. Ride Search & Vicinity Filtering
*   **Proximity-Based Sorting**: Rides are filtered and sorted using the Haversine formula and Euclidean calculations, ensuring that the closest rides appear at the top of the feed.
*   **Intuitive Visuals**: Static route maps display origin-to-destination routes directly in feed cards.

### 2. Live Passenger Location Sharing
*   **Static Location Markers**: Accepted passengers can share and update a static location pin of their current pick-up coordinates using their phone's GPS.
*   **Snappy Hybrid GPS Fetching**: Uses a cached location (`getLastKnownPositionAsync`) first for instant updates, falling back to a full active GPS lock if the cache is older than 5 minutes.
*   **Anti-Spam Rate Limiting**: Displays visual cooldown feedback enforced by a 30-second database-backed rate limit.

### 3. Driver Tracking Map & Legend
*   **Interactive Static Maps**: Renders route path polylines overlaying numbered pins (`1`, `2`, `3`...) matching the exact positions of accepted passengers.
*   **Rider Legend**: Identified by passenger initials and avatar colors matching their profile, showing the relative update age (e.g. *" Abdullah (just now)"*).
*   **Dynamic Auto-fitting**: The map viewport dynamically scales and pads to display the route, origin, destination, and all passengers in a single view.

### 4. Direct Turn-by-Turn Navigation
*   **One-Tap Native Routing**: Drivers can tap the **"Navigate"** action button next to any accepted passenger to open turn-by-turn driving directions in their device's native mapping application (Google Maps, Apple Maps, or Web fallback).

### 5. Robust Driver Control Panel
*   **Ride Control Actions**: Accept or decline passenger requests, remove active riders from the ride, and mark rides as completed.
*   **Phone Reveal Privacy Guard**: Restricts passenger and driver phone numbers, revealing contact information and dialer shortcuts *only* once a ride request is officially accepted.

---

## 🛠️ Technology Stack

*   **Framework**: Expo (React Native) with TypeScript.
*   **Routing**: Expo Router (File-based navigation with tabs).
*   **State & Networking**: Axios API client with React Context for Authentication.
*   **Mapping**: Mapbox Static Images API & OpenStreetMap Geocoding (Photon).
*   **Device APIs**: `expo-location` for location tracking, `expo-haptics` for micro-animations/tactile feedback, and native `Linking` for dialing and maps.

---

## ⚙️ Environment Variables

The mobile app relies on the following environment variables. Create a `.env` file in the root directory:

```env
# URL of the SafarSathi API Server
EXPO_PUBLIC_API_URL=https://safar-sathi-api-server.vercel.app/api

# Mapbox Public Access Token for map styling and static image generation
EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...
```

---

## 📂 Project Structure

```
artifacts/mobile/
├── app/                  # Expo Router navigation routes
│   ├── (tabs)/           # Tab navigation screens (feed, bookings, my rides, offer)
│   ├── ride-details/     # Full-page ride overview & seat book request
│   └── _layout.tsx       # Root layout, font loaders, and app load splash screen
├── assets/               # Splash screen, app icons, and branding resources
├── components/           # Shared UI components
│   ├── RideCard.tsx      # Standardized card rendering ride details
│   ├── StaticRouteMap.tsx # Origin-destination path map
│   └── PassengerTrackerMap.tsx # Driver-passenger tracking map with legend
├── data/                 # Static mock data & typings
└── src/                  # Client-side core logic
    ├── context/          # Authentication context
    ├── lib/              # API and client instances
    └── components/       # Login/Registration screens & chip selectors
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Run the install script from the mobile app folder:
```bash
pnpm install
```

### 2. Running Locally
Launch the Metro Bundler server:
```bash
pnpm run dev
```
Open it in the **Expo Go** client by scanning the QR code on your phone or launch it inside iOS/Android simulators.

### 3. Production EAS Builds
To generate a standalone Android APK directly through Expo Application Services (EAS):
```bash
npx eas-cli build --platform android --profile preview
```
---

## Dummy Test Accounts

For testing the passenger location sharing and driver tracking map integration, you can use these two dummy users, the password is same as the user:
1. **Driver**: `driver_test` (for posting a ride and viewing passenger location tracking maps)
2. **Passenger**: `passenger_test` (for requesting to join a ride and sharing location markers)
