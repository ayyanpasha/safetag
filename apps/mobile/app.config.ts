import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SafeTag",
  slug: "safetag",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./src/assets/images/icon.png",
  scheme: "safetag",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./src/assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0F172A",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.safetag.app",
    infoPlist: {
      NSCameraUsageDescription: "SafeTag needs camera access to scan QR codes.",
      NSLocationWhenInUseUsageDescription:
        "SafeTag needs your location to report incidents accurately.",
      NSFaceIDUsageDescription:
        "SafeTag uses Face ID for secure authentication.",
      UIBackgroundModes: ["voip", "remote-notification"],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./src/assets/images/adaptive-icon.png",
      backgroundColor: "#0F172A",
    },
    package: "com.safetag.app",
    permissions: [
      "CAMERA",
      "ACCESS_FINE_LOCATION",
      "RECORD_AUDIO",
      "USE_BIOMETRIC",
      "VIBRATE",
    ],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-camera",
    "expo-location",
    "expo-local-authentication",
    "expo-notifications",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0F172A",
        image: "./src/assets/images/splash.png",
        imageWidth: 200,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080",
    eas: {
      projectId: "your-eas-project-id",
    },
  },
});
