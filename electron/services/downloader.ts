import { downloadPlaylistThumbnail, convertThumbnail } from "./thumbnail";
import { fetchItemReleases, sortAllReleases } from "./releases";
import { getCacheDirectory, doesExist } from "../utils/os";
import { ToolPaths, getToolPaths } from "./tools";
import { importItemMetadata } from "./metadata";
import { Item } from "../../shared/types";
import sanitize from "sanitize-filename";
import { AbortError } from "../errors";
import { spawn } from "child_process";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

export interface StartOptions {
  onUpdateItems: (newItems: Item[]) => void;
  onUpdateItem: (newItem: Item) => void;
  onShowError: (error: unknown) => void;
  url: string;
}

export interface RetryOptions {
  onUpdateItems: (newItems: Item[]) => void;
  onUpdateItem: (newItem: Item) => void;
  onShowError: (error: unknown) => void;
  items: Item[];
}

interface DownloadOptions {
  onUpdateItems: (newItems: Item[]) => void;
  onUpdateItem: (newItem: Item) => void;
  onShowError: (error: unknown) => void;
}

interface Info {
  downloadsPath: string;
  playlist: string;
}

const FOLDER_NAME = "downloads";

export async function startDownloads(options: StartOptions, signal: AbortSignal) {
  const { onUpdateItems, onUpdateItem, onShowError, url } = options;
  const info = await buildInfo(options);
  const paths = getToolPaths();
  const { playlist } = info;
  const items = await prefetchDownloads(options, info, paths, signal);
  await downloadPlaylistThumbnail({ playlist, url }, paths, signal);
  await performDownloads(
    {
      onUpdateItems: (newItems: Item[]) => !signal.aborted && onUpdateItems(newItems),
      onUpdateItem: (newItem: Item) => !signal.aborted && onUpdateItem(newItem),
      onShowError: (error: unknown) => !signal.aborted && onShowError(error),
    },
    paths,
    signal,
    items,
  );
}

export async function retryDownloads(options: RetryOptions, signal: AbortSignal) {
  const { onUpdateItems, onUpdateItem, onShowError, items } = options;
  const paths = getToolPaths();
  await performDownloads(
    {
      onUpdateItems: (newItems: Item[]) => !signal.aborted && onUpdateItems(newItems),
      onUpdateItem: (newItem: Item) => !signal.aborted && onUpdateItem(newItem),
      onShowError: (error: unknown) => !signal.aborted && onShowError(error),
    },
    paths,
    signal,
    items,
  );
}

async function prefetchDownloads({ onUpdateItems, url }: StartOptions, { downloadsPath }: Info, { ytdlp, ffmpeg, deno }: ToolPaths, signal: AbortSignal): Promise<Item[]> {
  return new Promise((resolve, reject) => {
    log.info(`Prefetching downloads: ${url}`);
    const args = ["--ignore-config", "--abort-on-unavailable-fragments", "--abort-on-error", "--ffmpeg-location", ffmpeg, "--js-runtimes", `deno:${deno}`, "--skip-download", "--flat-playlist", "--dump-json", "--no-progress", url];
    const subprocess = spawn(ytdlp, args, { signal });
    const lines: string[] = [];

    subprocess.on("close", (code: number) => {
      if (code !== 0) {
        reject(new Error(`Prefetching downloads failed: ${code}`));
        return;
      }

      const items: Item[] = [];
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          const filename = sanitize(`${json["playlist_index"]} - ${json["title"]}.mp3`);
          const thumbnail = `${filename}.jpg`;
          items.push({
            itemStatus: "waiting",
            thumbnailPath: path.join(downloadsPath, thumbnail),
            downloadPath: path.join(downloadsPath, filename),
            imageType: "cover-art",
            playlist: json["playlist_id"],
            index: json["playlist_index"],
            title: json["title"],
            url: json["url"],
            id: json["id"],
          });
        } catch (error) {
          log.error(error);
          log.info(line);
          throw error;
        }
      }

      onUpdateItems(items);
      resolve(items);
    });

    subprocess.stdout.on("data", (data: Buffer) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        lines.push(message);
        log.silly(message);
      }
    });

    subprocess.stderr.on("data", (data: Buffer) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        log.warn(message);
      }
    });

    subprocess.on("error", reject);
  });
}

async function performDownloads(options: DownloadOptions, paths: ToolPaths, signal: AbortSignal, items: Item[]) {
  const { onUpdateItems, onUpdateItem, onShowError } = options;
  for (const item of items) {
    try {
      if (item.itemStatus !== "waiting") {
        continue;
      }

      if (signal.aborted) {
        throw new AbortError();
      }

      item.itemStatus = "downloading";
      onUpdateItem(item);

      const alreadyExists = await doesExist(item.downloadPath);
      if (!alreadyExists) {
        await performDownload(paths, signal, item);
        const exists = await doesExist(item.downloadPath);
        if (!exists) {
          throw new Error(`Downloaded file not found: ${item.downloadPath}`);
        }

        await convertThumbnail(item.thumbnailPath, item.id);
      } else {
        log.info(`${item.id} - Skipping download: ${item.downloadPath}`);
      }

      item.itemStatus = "fetching";
      onUpdateItem(item);

      await importItemMetadata(signal, item);
      await fetchItemReleases(signal, item);

      item.itemStatus = "downloaded";
      onUpdateItem(item);
    } catch (error) {
      if (item.itemStatus === "fetching") {
        item.itemStatus = "missing";
        onUpdateItem(item);
      } else {
        item.itemStatus = "failed";
        onUpdateItem(item);
      }

      onShowError(error);
    }
  }

  if (signal.aborted) {
    throw new AbortError();
  }

  log.info("Sorting releases...");
  sortAllReleases(items);
  log.info("Releases sorted");
  onUpdateItems(items);
}

async function performDownload({ ytdlp, ffmpeg, deno }: ToolPaths, signal: AbortSignal, item: Item): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!item.downloadPath) {
      reject(new Error("Invalid filepath to download"));
      return;
    }

    if (!item.url) {
      reject(new Error("Invalid url to download"));
      return;
    }

    log.info(`${item.id} - Starting download: ${item.url}`);
    const args = ["--ignore-config", "--abort-on-unavailable-fragments", "--abort-on-error", "--ffmpeg-location", ffmpeg, "--js-runtimes", `deno:${deno}`, "--write-thumbnail", "--convert-thumbnails", "jpg", "--output", item.downloadPath, "-t", "mp3", "--embed-metadata", "--no-progress", item.url];
    const subprocess = spawn(ytdlp, args, { signal });

    subprocess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Download failed: ${code}`));
        return;
      }

      resolve();
    });

    subprocess.stdout.on("data", (data: Buffer) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        log.verbose(message);
      }
    });

    subprocess.stderr.on("data", (data: Buffer) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        log.warn(message);
      }
    });

    subprocess.on("error", reject);
  });
}

async function buildInfo({ url }: StartOptions): Promise<Info> {
  const playlist = extractPlaylist(url);
  if (!playlist) {
    throw new Error(`Could not extract playlist id from url: ${url}`);
  }

  const downloadsPath = getFolderPath(playlist);
  await fs.mkdir(downloadsPath, { recursive: true });

  return { downloadsPath, playlist };
}

function extractPlaylist(url: string): string | null {
  try {
    const params = new URLSearchParams(new URL(url).search);
    return params.get("list") || null;
  } catch (error) {
    log.error(error);
    return null;
  }
}

function getFolderPath(playlist: string): string {
  return path.join(getCacheDirectory(), FOLDER_NAME, playlist);
}
