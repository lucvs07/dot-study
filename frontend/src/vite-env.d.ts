/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: "mock" | "api";
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
