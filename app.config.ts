import type { ExpoConfig } from "expo/config";

/**
 * ค่าตั้งของแอป WePaw (เจ้าของสัตว์เลี้ยง)
 * - EXPO_PUBLIC_API_URL      : URL ของ petcare backend (ตั้งต่อ profile ใน eas.json)
 * - GOOGLE_MAPS_ANDROID_KEY  : key ของ Google Maps SDK for Android (แผนที่ผลค้นหา) — ไม่ตั้ง = แผนที่ Android ว่าง
 * - APP_DOMAIN               : โดเมนเว็บ petcare สำหรับ universal link / app link (เช่น petcare.example.com)
 */
const BRAND = "#059669";
const appDomain = process.env.APP_DOMAIN;
/** โปรเจค EAS (บัญชี jame_jomchanpan) — สร้างด้วย `eas init` 2 ต.ค. 2026 · ใช้ทั้ง build, OTA update และ push token */
const projectId = "f138174c-4438-403e-ab70-8daf0c8098eb";

const config: ExpoConfig = {
  name: "WePaw",
  slug: "wepaw",
  owner: "jame_jomchanpan",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "wepaw",
  userInterfaceStyle: "automatic",
  backgroundColor: "#fafaf9",
  runtimeVersion: { policy: "appVersion" },
  updates: { url: `https://u.expo.dev/${projectId}` },
  ios: {
    bundleIdentifier: "app.wepaw.owner",
    supportsTablet: false,
    associatedDomains: appDomain ? [`applinks:${appDomain}`] : undefined,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "ใช้ตำแหน่งเพื่อค้นหาคลินิกใกล้คุณ และปักหมุดที่อยู่ให้หมอเยี่ยมบ้าน",
      NSCameraUsageDescription: "ใช้กล้องเพื่อถ่ายรูปน้อง รูปโปรไฟล์ และรูปประกอบรีวิว/แชท",
      NSPhotoLibraryUsageDescription: "เลือกรูปน้อง รูปโปรไฟล์ และรูปประกอบรีวิว/แชทจากคลังรูปภาพ",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "app.wepaw.owner",
    adaptiveIcon: {
      backgroundColor: BRAND,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "CAMERA", "POST_NOTIFICATIONS"],
    config: process.env.GOOGLE_MAPS_ANDROID_KEY
      ? { googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY } }
      : undefined,
    intentFilters: appDomain
      ? [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              { scheme: "https", host: appDomain, pathPrefix: "/pets/share" },
              { scheme: "https", host: appDomain, pathPrefix: "/claim" },
              { scheme: "https", host: appDomain, pathPrefix: "/clinic" },
            ],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ]
      : undefined,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#ecfdf5",
        image: "./assets/images/splash-icon.png",
        imageWidth: 96,
        dark: { backgroundColor: "#0c0a09", image: "./assets/images/splash-icon.png" },
      },
    ],
    [
      "expo-location",
      { locationWhenInUsePermission: "ใช้ตำแหน่งเพื่อค้นหาคลินิกใกล้คุณ และปักหมุดที่อยู่ให้หมอเยี่ยมบ้าน" },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "เลือกรูปน้อง รูปโปรไฟล์ และรูปประกอบรีวิว/แชทจากคลังรูปภาพ",
        cameraPermission: "ใช้กล้องเพื่อถ่ายรูปน้อง รูปโปรไฟล์ และรูปประกอบรีวิว/แชท",
      },
    ],
    ["expo-notifications", { color: BRAND, defaultChannel: "default" }],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: { projectId },
  },
};

export default config;
