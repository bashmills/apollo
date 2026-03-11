import { getCacheDirectory, doesExist } from "../utils/os";
import { limiter } from "../utils/limiter";
import { convertImage } from "./image";
import { spawn } from "child_process";
import { ToolPaths } from "./tools";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

interface Thumbnail {
  height: number;
  width: number;
  url: string;
  id: string;
}

export interface Options {
  playlist: string;
  url: string;
}

interface Info {
  filepath: string;
  filename: string;
}

const CACHED_FILENAMES = new Map<string, string | null>();
const FOLDER_NAME = "thumbnail";
const DELAY = 1000;

export async function downloadPlaylistThumbnail(options: Options, paths: ToolPaths, signal: AbortSignal) {
  const { playlist } = options;
  const info = await buildInfo(playlist);
  const thumbnails = await fetchThumbnails(options, paths, signal);
  const sorted = sortThumbnails(thumbnails);
  await downloadThumbnail(sorted, info);
}

export async function convertThumbnail(thumbnailPath: string, id?: string) {
  if (!id) {
    throw new Error(`Invalid id for thumbnail: ${id}`);
  }

  const outputPath = getFilepath(id);
  log.info(`${id} - Converting thumbnail: ${thumbnailPath} -> ${outputPath}`);
  const buffer = await convertImage(thumbnailPath);
  await fs.writeFile(outputPath, buffer);
  await fs.rm(thumbnailPath);
}

export async function fetchThumbnail(id: string): Promise<string | null> {
  const filename = CACHED_FILENAMES.get(id);
  if (filename !== undefined) {
    log.debug(`Cached thumbnail: ${filename}`);
    return filename;
  }

  const info = await buildInfo(id);
  const result = await getThumbnail(info);
  CACHED_FILENAMES.set(id, result);
  return result;
}

export function getThumbnailPath(id?: string): string | null {
  if (id) {
    return getFilepath(id);
  }

  return null;
}

async function fetchThumbnails({ url }: Options, { ytdlp, ffmpeg, deno }: ToolPaths, signal: AbortSignal): Promise<Thumbnail[]> {
  return new Promise((resolve, reject) => {
    log.info(`Prefetching thumbnails: ${url}`);
    const args = ["--ignore-config", "--abort-on-unavailable-fragments", "--abort-on-error", "--ffmpeg-location", ffmpeg, "--js-runtimes", `deno:${deno}`, "--skip-download", "--flat-playlist", "--dump-single-json", "--playlist-items", "0", "--no-progress", url];
    const subprocess = spawn(ytdlp, args, { signal });
    const lines: string[] = [];

    subprocess.on("close", (code: number) => {
      if (code !== 0) {
        reject(new Error(`Prefetching thumbnails failed: ${code}`));
        return;
      }

      if (lines.length !== 1) {
        reject(new Error(`Invalid lines for thumbnails: ${lines.length}`));
        return;
      }

      const thumbnails: Thumbnail[] = [];
      const line = lines[0];
      try {
        const json = JSON.parse(line);
        for (const thumbnail of json["thumbnails"] ?? []) {
          thumbnails.push({
            height: thumbnail["height"] ?? 0,
            width: thumbnail["width"] ?? 0,
            url: thumbnail["url"] ?? "",
            id: thumbnail["id"] ?? "",
          });
        }
      } catch (error) {
        log.error(error);
        log.info(line);
        throw error;
      }

      resolve(thumbnails);
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

function sortThumbnails(thumbnails: Thumbnail[]): Thumbnail[] {
  return [...thumbnails].sort((a, b) => {
    const aIsBig = a.width >= 500 && a.height >= 500;
    const bIsBig = b.width >= 500 && b.height >= 500;
    const aArea = a.width * a.height;
    const bArea = b.width * b.height;

    if (!aIsBig && !bIsBig) {
      return bArea - aArea;
    }

    if (aIsBig && bIsBig) {
      return aArea - bArea;
    }

    if (aIsBig && !bIsBig) {
      return -1;
    }

    if (!aIsBig && bIsBig) {
      return 1;
    }

    return 0;
  });
}

async function downloadThumbnail(thumbnails: Thumbnail[], info: Info) {
  const { filepath } = info;
  for (const thumbnail of thumbnails) {
    try {
      const url = new URL(thumbnail.url);
      const response = await limiter(
        url,
        async () => {
          log.info(`Fetching playlist thumbnail: ${url}`);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Playlist thumbnail error: ${response.status} - ${response.statusText}`);
          }

          return response;
        },
        DELAY,
      );

      log.info(`Saving playlist thumbnail: ${filepath}`);
      const arrayBuffer = Buffer.from(await response.arrayBuffer());
      const buffer = await convertImage(arrayBuffer);
      await fs.writeFile(filepath, buffer);
      return;
    } catch (error) {
      log.error(error);
    }
  }
}

async function getThumbnail({ filepath, filename }: Info): Promise<string | null> {
  const exists = await doesExist(filepath);
  if (exists) {
    log.info(`Found thumbnail: ${filepath}`);
    return filename;
  }

  log.error(`Missing thumbnail: ${filepath}`);
  return null;
}

async function buildInfo(id: string): Promise<Info> {
  await fs.mkdir(getFolderPath(), { recursive: true });
  const filepath = getFilepath(id);
  const filename = getFilename(id);

  return { filepath, filename };
}

function getFolderPath(): string {
  return path.join(getCacheDirectory(), FOLDER_NAME);
}

function getFilepath(id: string): string {
  return path.join(getFolderPath(), getFilename(id));
}

function getFilename(id: string): string {
  return `${id}.jpg`;
}
