import { getCacheDirectory } from "../utils/os";
import { exportItemMetadata } from "./metadata";
import { Item } from "../../shared/types";
import sanitize from "sanitize-filename";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

interface Options {
  onUpdateItem: (newItem: Item) => void;
  folder: string;
  items: Item[];
}

interface Info {
  intermediatePath: string;
}

const FOLDER_NAME = "intermediate";

export async function exportDownloads({ onUpdateItem, folder, items }: Options) {
  try {
    await cleanupFolders();
    const info = await buildInfo();
    for (const item of items) {
      if (item.itemStatus !== "saving") {
        continue;
      }

      const filepath = await copyToIntermediateFolder(info, item);
      await exportItemMetadata(filepath, item);
      await saveItem(filepath, folder, item);

      item.itemStatus = "saved";
      onUpdateItem(item);
    }
  } finally {
    await cleanupFolders();
  }
}

async function copyToIntermediateFolder(info: Info, item: Item): Promise<string> {
  const filename = path.basename(item.downloadPath);
  const filepath = path.join(info.intermediatePath, filename);
  log.info(`${item.id} - Copying item: ${filepath}`);
  await fs.copyFile(item.downloadPath, filepath);
  return filepath;
}

async function saveItem(sourcePath: string, folder: string, item: Item) {
  const paddingFunc = (padding: number, value: number): string => {
    return String(value).padStart(padding, "0");
  };

  if (!sourcePath) {
    throw new Error("Invalid filepath to save");
  }

  const release = item.releases?.at(0);
  if (!release) {
    throw new Error("Invalid release");
  }

  const performer = sanitize(release.performer ?? release.artist ?? "Unknown Artist");
  const title = sanitize(release.title ?? item.title ?? "Unknown Title");
  const album = sanitize(release.album ?? "Unknown Album");
  const track = release.track ?? item.index ?? 0;
  const disc = release.disc ?? 0;

  const filename = sanitize(`${paddingFunc(2, disc)} ${paddingFunc(2, track)} - ${title}.mp3`);
  let destPath = path.join(folder, performer, album);
  await fs.mkdir(destPath, { recursive: true });
  destPath = path.join(destPath, filename);

  log.info(`${item.id} - Saving item: ${destPath}`);
  await fs.copyFile(sourcePath, destPath);
  await fs.rm(sourcePath);
}

async function cleanupFolders() {
  await fs.rm(getFolderPath(), { recursive: true, force: true });
}

async function buildInfo(): Promise<Info> {
  await fs.mkdir(getFolderPath(), { recursive: true });
  const intermediatePath = getFolderPath();

  return {
    intermediatePath,
  };
}

function getFolderPath(): string {
  return path.join(getCacheDirectory(), FOLDER_NAME);
}
