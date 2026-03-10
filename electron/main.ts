import { app, BrowserWindow, ipcMain } from "electron";
import { startDownload } from "./utils/downloader";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
    width: 800,
    height: 600,
  });

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (!VITE_DEV_SERVER_URL) {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  } else {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    mainWindow = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

ipcMain.handle("start-download", async (event, url) => {
  try {
    console.log(`Starting download for: ${url}`);
    const downloadPath = await startDownload(event, url);
    return `Download path: ${downloadPath}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    event.sender.send("download-failed", errorMessage);
    throw error;
  }
});
