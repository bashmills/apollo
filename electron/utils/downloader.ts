import { spawn } from "child_process";
import { URL } from "url";
import path from "path";
import os from "os";
import fs from "fs";

export function startDownload(event: Electron.IpcMainInvokeEvent, url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { downloadPath } = buildDownloadPath(url);
    const args = buildArgs(downloadPath, url);

    const proc = spawn("yt-dlp", args);

    proc.stdout.on("data", (data: Buffer) => {
      event.sender.send("download-progress", data.toString());
    });

    proc.stderr.on("data", (data: Buffer) => {
      event.sender.send("download-failed", data.toString());
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        const errorMessage = `Process exited with code: ${code}`;
        event.sender.send("download-failed", errorMessage);
        reject(new Error(errorMessage));
      } else {
        event.sender.send("download-complete");
        resolve(downloadPath);
      }
    });

    proc.on("error", (err: Error) => {
      const errorMessage = `Invalid exit code: ${err.message}`;
      event.sender.send("download-failed", errorMessage);
      reject(err);
    });
  });
}

export function buildDownloadPath(url: string) {
  const playlistId = extractPlaylistId(url);
  if (!playlistId) {
    throw new Error("Could not extract playlist ID from URL");
  }

  const cacheDirectory = getCacheDirectory();
  const appFolder = "apollo";
  const playlistFolder = playlistId;

  const downloadPath = path.join(cacheDirectory, appFolder, playlistFolder);

  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  return { downloadPath, playlistId };
}

export function extractPlaylistId(url: string) {
  try {
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.search);
    return params.get("list") || null;
  } catch (error) {
    console.error("Failed to parse URL:", error);
    return null;
  }
}

export function getCacheDirectory() {
  const platform = process.platform;
  const home = os.homedir();

  switch (platform) {
    case "win32":
      return path.join(home, "AppData", "Local");
    case "darwin":
      return path.join(home, "Library", "Caches");
    case "linux":
    default:
      return path.join(home, ".cache");
  }
}

export function buildArgs(downloadPath: string, url: string) {
  return ["--output", path.join(downloadPath, "%(playlist_index)s - %(title)s.%(ext)s"), "-t", "mp3", url];
}
