import { fileURLToPath } from "url";
import { app } from "electron";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.join(DIRNAME, "..");

const FOLDER_NAME = "apollo";

export function getResourcesDirectory(): string {
  if (!app.isPackaged) {
    const platform = process.platform;
    switch (platform) {
      case "darwin":
        return path.join(APP_ROOT, "resources", "darwin");
      case "win32":
        return path.join(APP_ROOT, "resources", "win");
      case "linux":
        return path.join(APP_ROOT, "resources", "linux");
    }
  }

  return process.resourcesPath;
}

export function getCacheDirectory(): string {
  const platform = process.platform;
  const home = os.homedir();
  switch (platform) {
    case "darwin":
      return path.join(home, "Library", "Caches", FOLDER_NAME);
    case "win32":
      return path.join(home, "AppData", "Local", FOLDER_NAME);
    case "linux":
      return path.join(home, ".cache", FOLDER_NAME);
  }

  throw new Error("Unknown platform");
}

export function getDataDirectory(): string {
  const platform = process.platform;
  const home = os.homedir();
  switch (platform) {
    case "darwin":
      return path.join(home, "Library", "Application Support", FOLDER_NAME);
    case "win32":
      return path.join(home, "AppData", "Local", FOLDER_NAME);
    case "linux":
      return path.join(home, ".local", "share", FOLDER_NAME);
  }

  throw new Error("Unknown platform");
}

export async function doesExist(filepath?: string | null): Promise<boolean> {
  try {
    const stats = filepath ? await fs.stat(filepath) : null;
    if (!stats) {
      return false;
    }

    return stats.size > 0;
  } catch (error) {
    return false;
  }
}
