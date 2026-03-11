import { getCacheDirectory, doesExist } from "../utils/os";
import { limiter } from "../utils/limiter";
import { convertImage } from "./image";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

interface Info {
  filepath: string;
  filename: string;
  id: string;
}

const CACHED_REQUESTS = new Map<string, Promise<string | null>>();
const CACHED_FILENAMES = new Map<string, string | null>();
const FOLDER_NAME = "cover-art";
const DELAY = 100;

export async function fetchCoverArt(id: string): Promise<string | null> {
  const filename = CACHED_FILENAMES.get(id);
  if (filename !== undefined) {
    log.debug(`Cached cover art: ${filename}`);
    return filename;
  }

  const request = CACHED_REQUESTS.get(id);
  if (request !== undefined) {
    log.debug(`Cached request: ${id}`);
    return request;
  }

  const info = await buildInfo(id);
  const promise = getCoverArt(info);
  CACHED_REQUESTS.set(id, promise);
  const result = await promise;
  CACHED_FILENAMES.set(id, result);
  CACHED_REQUESTS.delete(id);
  return result;
}

export function getCoverArtPath(id?: string): string | null {
  if (id) {
    return getFilepath(id);
  }

  return null;
}

async function getCoverArt({ filepath, filename, id }: Info): Promise<string | null> {
  try {
    const exists = await doesExist(filepath);
    if (exists) {
      log.info(`Found cover art: ${filepath}`);
      return filename;
    }

    const url = new URL(`https://coverartarchive.org/release-group/${id}/front`);
    const response = await limiter(
      url,
      async () => {
        log.info(`Fetching cover art: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Cover Art Archive error: ${response.status} - ${response.statusText}`);
        }

        return response;
      },
      DELAY,
    );

    log.info(`Saving cover art: ${filepath}`);
    const arrayBuffer = Buffer.from(await response.arrayBuffer());
    const buffer = await convertImage(arrayBuffer);
    await fs.writeFile(filepath, buffer);
    return filename;
  } catch (error) {
    log.error(error);
    return null;
  }
}

async function buildInfo(id: string): Promise<Info> {
  await fs.mkdir(getFolderPath(), { recursive: true });
  const filepath = getFilepath(id);
  const filename = getFilename(id);

  return { filepath, filename, id };
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
