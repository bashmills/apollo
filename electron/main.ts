import { overrideDownload, searchCustomReleases } from "./services/releases";
import { checkLatestVersion, saveToken, getToken } from "./services/tools";
import { BrowserWindow, ipcMain, protocol, dialog, app } from "electron";
import { startDownloads, retryDownloads } from "./services/downloader";
import { fetchThumbnail } from "./services/thumbnail";
import { fetchCoverArt } from "./services/cover-art";
import { exportDownloads } from "./services/saver";
import { Metadata, Item } from "../shared/types";
import { getCacheDirectory } from "./utils/os";
import { APP_ROOT, DIRNAME } from "./utils/os";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const ELECTRON_DIST = path.join(APP_ROOT, "dist-electron");
export const PUBLIC = path.join(APP_ROOT, "public");
export const DIST = path.join(APP_ROOT, "dist");
export const VITE_PUBLIC = VITE_DEV_SERVER_URL ? PUBLIC : DIST;

const PROTOCOL_SCHEME = "apollo";

let abortController: AbortController | null = null;
let mainWindow: BrowserWindow | null;

process.env.VITE_PUBLIC = VITE_PUBLIC;
process.env.APP_ROOT = APP_ROOT;

protocol.registerSchemesAsPrivileged([
  {
    scheme: PROTOCOL_SCHEME,
    privileges: {
      supportFetchAPI: true,
      corsEnabled: true,
      standard: true,
      secure: true,
    },
  },
]);

log.transports.console.level = VITE_DEV_SERVER_URL ? "debug" : "info";
log.transports.remote.level = false;
log.transports.file.level = "silly";
log.transports.ipc.level = false;
log.initialize();

function registerProtocols() {
  protocol.handle(PROTOCOL_SCHEME, async (request) => {
    try {
      const filename = request.url.slice(PROTOCOL_SCHEME.length + 3);
      const directory = getCacheDirectory();
      const filepath = path.join(directory, filename);
      const data = await fs.readFile(filepath);
      return new Response(data, {
        headers: {
          "Content-Type": "image/jpeg",
        },
      });
    } catch (error) {
      console.error(error);
      return new Response(null, {
        statusText: "File not found",
        status: 404,
      });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(VITE_PUBLIC, "apollo.png"),
    webPreferences: {
      preload: path.join(DIRNAME, "preload.mjs"),
    },
    minWidth: 640,
    minHeight: 512,
    width: 1280,
    height: 1024,
  });

  if (!VITE_DEV_SERVER_URL) {
    mainWindow.loadFile(path.join(DIST, "index.html"));
    mainWindow.removeMenu();
  } else {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    mainWindow = null;
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(registerProtocols).then(createWindow);

ipcMain.handle("search-custom-releases", async (event, metadata: Metadata, item: Item) => {
  try {
    log.info(`Searching custom releases: ${item.id}`);
    const signal = resetAbortController();
    const releases = await searchCustomReleases({ metadata, item }, signal);
    log.info(`Found ${releases.length} releases`);
    return releases;
  } catch (error) {
    log.error(`Search custom releases failed: ${error}`);
    event.sender.send("show-error", error);
    return null;
  } finally {
    abortController = null;
  }
});

ipcMain.handle("request-thumbnail", async (event, id: string) => {
  try {
    log.info(`Requesting thumbnail: ${id}`);
    const filename = await fetchThumbnail(id);
    if (!filename) {
      return null;
    }

    log.info(`Thumbnail success: ${filename}`);
    return filename;
  } catch (error) {
    log.error(`Thumbnail failed: ${error}`);
    event.sender.send("show-error", error);
    return null;
  }
});

ipcMain.handle("request-cover-art", async (event, id: string) => {
  try {
    log.info(`Requesting cover art: ${id}`);
    const filename = await fetchCoverArt(id);
    if (!filename) {
      return null;
    }

    log.info(`Cover art success: ${filename}`);
    return filename;
  } catch (error) {
    log.error(`Cover art failed: ${error}`);
    event.sender.send("show-error", error);
    return null;
  }
});

ipcMain.handle("export-download", async (event, items: Item[], folder: string) => {
  try {
    log.info(`Exporting download: ${folder}`);
    await exportDownloads({
      onUpdateItem: (newItem: Item) => {
        event.sender.send("update-item", newItem);
      },
      folder,
      items,
    });
    log.info("Export success");
    return true;
  } catch (error) {
    log.error(`Export failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  }
});

ipcMain.handle("choose-folder", async (event) => {
  try {
    log.info("Waiting for user to choose folder...");
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (result.filePaths.length === 0 || result.canceled) {
      return "";
    }

    const folder = result.filePaths[0];
    log.info(`Folder chosen: ${folder}`);
    return folder;
  } catch (error) {
    log.error(`Choose folder failed: ${error}`);
    event.sender.send("show-error", error);
    return "";
  }
});

ipcMain.handle("override-download", async (event, items: Item[], item: Item) => {
  try {
    log.info(`Overriding download: ${item.id}`);
    const signal = resetAbortController();
    await overrideDownload(
      {
        onUpdateItem: (newItem: Item) => {
          event.sender.send("update-item", newItem);
        },
        onShowError: (error: unknown) => {
          event.sender.send("show-error", error);
        },
        items,
        item,
      },
      signal,
    );
    log.info("Override success");
    return true;
  } catch (error) {
    log.error(`Override failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  } finally {
    abortController = null;
  }
});

ipcMain.handle("start-download", async (event, url: string) => {
  try {
    log.info(`Starting download: ${url}`);
    const signal = resetAbortController();
    await startDownloads(
      {
        onUpdateItems: (newItems: Item[]) => {
          event.sender.send("update-items", newItems);
        },
        onUpdateItem: (newItem: Item) => {
          event.sender.send("update-item", newItem);
        },
        onShowError: (error: unknown) => {
          event.sender.send("show-error", error);
        },
        url,
      },
      signal,
    );

    log.info("Download success");
    return true;
  } catch (error) {
    log.error(`Start download failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  } finally {
    abortController = null;
  }
});

ipcMain.handle("retry-download", async (event, items: Item[]) => {
  try {
    log.info("Retrying download...");
    const signal = resetAbortController();
    await retryDownloads(
      {
        onUpdateItems: (newItems: Item[]) => {
          event.sender.send("update-items", newItems);
        },
        onUpdateItem: (newItem: Item) => {
          event.sender.send("update-item", newItem);
        },
        onShowError: (error: unknown) => {
          event.sender.send("show-error", error);
        },
        items,
      },
      signal,
    );

    log.info("Retry success");
    return true;
  } catch (error) {
    log.error(`Retry download failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  } finally {
    abortController = null;
  }
});

ipcMain.handle("stop-download", async (event) => {
  try {
    log.info("Stopping download...");
    abort();
    log.info("Download stopped");
    return true;
  } catch (error) {
    log.error(`Stop download failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  }
});

ipcMain.handle("save-personal-access-token", async (event, token: string) => {
  try {
    log.info(`Saving personal access token: ${token}`);
    await saveToken(token);
    log.info("Token saved");
    return true;
  } catch (error) {
    log.error(`Saving token failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  }
});

ipcMain.handle("get-personal-access-token", async (event) => {
  try {
    log.info("Getting personal access token...");
    const token = await getToken();
    log.info(`Got token: ${token}`);
    return token;
  } catch (error) {
    log.error(`Getting token failed: ${error}`);
    event.sender.send("show-error", error);
    return null;
  }
});

ipcMain.handle("fetch-latest", async (event) => {
  try {
    log.info("Fetching latest...");
    const signal = resetAbortController();
    await checkLatestVersion(signal);
    log.info("Latest fetched");
    return true;
  } catch (error) {
    log.error(`Fetching latest failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  } finally {
    abortController = null;
  }
});

ipcMain.handle("clear-cache", async (event) => {
  try {
    log.info("Clearing cache...");
    await fs.rm(getCacheDirectory(), { recursive: true, force: true });
    log.info("Cache cleared");
    return true;
  } catch (error) {
    log.error(`Clear cached failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  }
});

ipcMain.handle("get-version", async () => {
  return app.getVersion();
});

function resetAbortController(): AbortSignal {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }

  abortController = new AbortController();
  const { signal } = abortController;
  return signal;
}

function abort() {
  if (!abortController) {
    throw new Error("Nothing to abort");
  }

  abortController.abort();
  abortController = null;
}
