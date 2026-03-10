/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_PUBLIC: string;
    APP_ROOT: string;
  }
}

interface Window {
  backend: {
    onDownloadProgress: (callback: (data: string) => void) => void;
    onDownloadComplete: (callback: (data: string) => void) => void;
    onDownloadError: (callback: (data: string) => void) => void;
    startDownload: (url: string) => Promise<string>;
  };
  ipcRenderer: import("electron").IpcRenderer;
}
