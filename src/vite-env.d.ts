/// <reference types="vite/client" />
/// <reference types="vitest" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_MOCK_AUTH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
