import { MetadataType, FetchResult, Settings, Metadata, Item, Versions } from "../shared/types";
/// <reference types="vite-plugin-electron/electron-env" />

declare global {
  interface Window {
    backend: {
      onUpdateItems: (callback: (newItems: Item[]) => void) => () => void;
      onUpdateItem: (callback: (newItem: Item) => void) => () => void;
      onShowError: (callback: (error: Error) => void) => () => void;

      searchCustomReleases: (metadata: Metadata, item: Item) => Promise<string[]>;
      requestThumbnail: (id: string) => Promise<string | null>;
      requestCoverArt: (id: string) => Promise<string | null>;

      exportDownload: (items: Item[], folder: string) => Promise<boolean>;
      chooseFolder: () => Promise<string>;

      overrideDownload: (items: Item[], item: Item) => Promise<boolean>;
      startDownload: (metadataType: MetadataType, url: string) => Promise<boolean>;
      retryDownload: (items: Item[]) => Promise<boolean>;
      stopDownload: () => Promise<boolean>;

      saveSettings: (settings: Settings) => Promise<boolean>;
      getSettings: () => Promise<Settings | null>;

      fetchLatest: () => Promise<FetchResult>;
      clearCache: () => Promise<boolean>;

      getVersions: () => Promise<Versions | null>;
    };
  }

  declare namespace NodeJS {
    interface ProcessEnv {
      VITE_PUBLIC: string;
      APP_ROOT: string;
    }
  }
}
