/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PASSCODE_HASH?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_DRIVE_ROOT_FOLDER_ID?: string;
  readonly VITE_BOOTSTRAP_FILE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
