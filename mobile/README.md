# Voice Meter Mobile (React Native + Expo)

## Setup

### 1. Create Conda Environment

```bash
conda env create -f environment.yml
conda activate voice_meter_mobile
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Note:** We use `--legacy-peer-deps` to handle React version compatibility between Expo and testing libraries.

### 3. Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

For Android development, update `API_URL` to use your computer's local IP address instead of `localhost`:
```
API_URL=http://192.168.1.xxx:8000/api/v1
```

### 4. Run the Application

Start the development server:

```bash
npm start
```

Or run on specific platforms:

```bash
# Web (opens in browser at http://localhost:8081)
npm run web

# iOS
npm run ios

# Android
npm run android
```

**For Web Development:**
The easiest way to run the web version is:
```bash
npm run web
# or
npx expo start --web
```

This will automatically open http://localhost:8081 in your browser.

**For Mobile Development:**
```bash
npm start
# Then press 'w' for web, 'a' for Android, or 'i' for iOS
```

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx
│   └── index.tsx
├── src/
│   ├── config/
│   │   └── index.ts
│   └── services/
│       └── api.ts
├── assets/
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
└── environment.yml
```

## Development

This is an Expo-based React Native application using:
- **Expo Router** for file-based routing
- **TypeScript** for type safety
- **Axios** for API calls
- **AsyncStorage** for local storage

### File-based Routing

The app uses Expo Router for navigation. Add new screens in the `app/` directory:
- `app/index.tsx` - Home screen
- `app/profile.tsx` - Profile screen (example)
- `app/_layout.tsx` - Root layout with navigation

### API Integration

API calls are handled through `src/services/api.ts`. The service includes:
- Axios instance with base configuration
- Request/response interceptors
- Error handling

Add new API methods to `apiService` object.

## Testing

```bash
npm test
```

## Building for Production

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

## Notes

- Make sure the backend API is running before testing the mobile app
- For Android emulator/device, use your computer's local IP address instead of `localhost`
- For iOS simulator, `localhost` will work fine
