import Constants from "expo-constants";

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:8080";

export const QR_URL_PATTERN = /safetag:\/\/s\/(ST-[A-Z0-9]+)/;
export const QR_HTTP_PATTERN = /\/s\/(ST-[A-Z0-9]+)/;

export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const QUERY_GC_TIME = 30 * 60 * 1000; // 30 minutes

export const BIOMETRIC_TIMEOUT = 5 * 60 * 1000; // 5 minutes
