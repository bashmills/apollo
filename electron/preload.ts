import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
import { Metadata, Item } from "../shared/types";

contextBridge.exposeInMainWorld("backend", {
  onUpdateItems: (callback: (newItems: Item[]) => void) => {
    const listener = (_: IpcRendererEvent, newItems: Item[]) => {
      callback(newItems);
    };
    ipcRenderer.on("update-items", listener);
    return () => {
      ipcRenderer.off("update-items", listener);
    };
  },

  onUpdateItem: (callback: (newItem: Item) => void) => {
    const listener = (_: IpcRendererEvent, newItem: Item) => {
      callback(newItem);
    };
    ipcRenderer.on("update-item", listener);
    return () => {
      ipcRenderer.off("update-item", listener);
    };
  },

  onShowError: (callback: (error: Error) => void) => {
    const listener = (_: IpcRendererEvent, error: Error) => {
      callback(error);
    };
    ipcRenderer.on("show-error", listener);
    return () => {
      ipcRenderer.off("show-error", listener);
    };
  },

  searchCustomReleases: (metadata: Metadata, item: Item) => ipcRenderer.invoke("search-custom-releases", metadata, item),
  requestThumbnail: (id: string) => ipcRenderer.invoke("request-thumbnail", id),
  requestCoverArt: (id: string) => ipcRenderer.invoke("request-cover-art", id),

  exportDownload: (items: Item[], folder: string) => ipcRenderer.invoke("export-download", items, folder),
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),

  overrideDownload: (items: Item[], item: Item) => ipcRenderer.invoke("override-download", items, item),
  startDownload: (url: string) => ipcRenderer.invoke("start-download", url),
  retryDownload: (items: Item[]) => ipcRenderer.invoke("retry-download", items),
  stopDownload: () => ipcRenderer.invoke("stop-download"),

  savePersonalAccessToken: (token: string) => ipcRenderer.invoke("save-personal-access-token", token),
  getPersonalAccessToken: () => ipcRenderer.invoke("get-personal-access-token"),

  fetchLatest: () => ipcRenderer.invoke("fetch-latest"),
  clearCache: () => ipcRenderer.invoke("clear-cache"),

  getVersion: () => ipcRenderer.invoke("get-version"),
});
