import { getResourcesDirectory, getDataDirectory, doesExist } from "../utils/os";
import { NotModifiedError, RateLimitError } from "../errors";
import { Config, writeConfig, readConfig } from "./config";
import { safeStorage, app } from "electron";
import { limiter } from "../utils/limiter";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

type ToolType = "yt-dlp" | "ffmpeg" | "deno";

export interface ToolPaths {
  ytdlp: string;
  ffmpeg: string;
  deno: string;
}

interface Tool {
  assetNames?: Map<NodeJS.Platform, string>;
  toolNames: Map<NodeJS.Platform, string>;
}

interface Info {
  assetName: string;
  toolPath: string;
}

interface Version {
  assets: Asset[];
  etag: string;
  currentVersion: string;
}

interface Asset {
  downloadUrl: string;
  name: string;
}

const TOOLS = new Map<ToolType, Tool>([
  [
    "yt-dlp",
    {
      assetNames: new Map<NodeJS.Platform, string>([
        ["darwin", "yt-dlp_macos"],
        ["linux", "yt-dlp_linux"],
        ["win32", "yt-dlp.exe"],
      ]),
      toolNames: new Map<NodeJS.Platform, string>([
        ["win32", "yt-dlp.exe"],
        ["darwin", "yt-dlp"],
        ["linux", "yt-dlp"],
      ]),
    },
  ],
  [
    "ffmpeg",
    {
      toolNames: new Map<NodeJS.Platform, string>([
        ["win32", "ffmpeg.exe"],
        ["darwin", "ffmpeg"],
        ["linux", "ffmpeg"],
      ]),
    },
  ],
  [
    "deno",
    {
      toolNames: new Map<NodeJS.Platform, string>([
        ["win32", "deno.exe"],
        ["darwin", "deno"],
        ["linux", "deno"],
      ]),
    },
  ],
]);

const GITHUB_API_URL = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";
const USER_AGENT = `Apollo/${app.getVersion()} ( bashmills@proton.me )`;
const CHECK_THRESHOLD = 1000 * 60 * 60;
const DELAY = 1000;

export async function checkLatestVersion(signal: AbortSignal) {
  const config = await readConfig();
  const lastChecked = Date.now();

  if (isWaitingForRetry(config)) {
    throw new RateLimitError();
  }

  try {
    const info = await buildInfo();
    if (await hasCachedVersion(config, info)) {
      log.info(`Using cached yt-dlp version: ${config.currentVersion}`);
      return;
    }

    const version = await fetchLatestVersion(signal, config);
    if (isSameVersion(config, version)) {
      throw new NotModifiedError();
    }

    log.info(`Downloading new yt-dlp version: ${version.currentVersion}`);
    await downloadVersion(info, signal, version);
    log.info(`Using new yt-dlp version: ${version.currentVersion}`);
    const { currentVersion, etag } = version;
    await writeConfig({
      ...config,
      currentVersion,
      lastChecked,
      etag,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      const { retryAfter } = error;
      await writeConfig({
        ...config,
        lastChecked,
        retryAfter,
      });

      throw error;
    }

    if (error instanceof NotModifiedError) {
      log.info(`Using same yt-dlp version: ${config.currentVersion}`);
      await writeConfig({
        ...config,
        lastChecked,
      });

      return;
    }

    throw error;
  }
}

export async function saveToken(token: string) {
  const oldConfig = await readConfig();
  const config = applyToken(oldConfig, token);
  await writeConfig(config);
}

export async function getToken(): Promise<string> {
  const config = await readConfig();
  if (config.personalAccessToken) {
    return decryptToken(config.personalAccessToken);
  }

  return "";
}

export function getToolPaths(): ToolPaths {
  const getPath = (toolType: ToolType): string => {
    const toolPath = getToolPath(toolType);
    log.info(`Tool: ${toolType} = ${toolPath}`);
    return toolPath;
  };

  return {
    ytdlp: getPath("yt-dlp"),
    ffmpeg: getPath("ffmpeg"),
    deno: getPath("deno"),
  };
}

async function fetchLatestVersion(signal: AbortSignal, config: Config): Promise<Version> {
  const url = new URL(GITHUB_API_URL);
  const response = await limiter(
    url,
    async () => {
      log.info(`Fetching lastest version: ${url}`);
      const headers = getHeaders(config);
      const response = await fetch(url, {
        headers,
        signal,
      });

      if (response.status === 429 || response.status === 403) {
        if (response.headers.get("x-ratelimit-remaining") === "0") {
          const resetHeader = response.headers.get("x-ratelimit-reset");
          const retryHeader = response.headers.get("retry-after");
          let retryAfter = 0;

          if (retryHeader) {
            retryAfter = Math.max(Date.now() + Number(retryHeader) * 1000, retryAfter);
          }

          if (resetHeader) {
            retryAfter = Math.max(Number(resetHeader) * 1000, retryAfter);
          }

          if (retryAfter === 0) {
            retryAfter = Math.max(60 * 1000, retryAfter);
          }

          throw new RateLimitError(retryAfter);
        }
      }

      if (response.status === 304) {
        throw new NotModifiedError();
      }

      if (!response.ok) {
        throw new Error(`GitHub error: ${response.status} - ${response.statusText}`);
      }

      return response;
    },
    DELAY,
  );

  const result = await response.json();
  if (!result) {
    throw new Error("No latest yt-dlp version found");
  }

  return {
    assets: result["assets"]?.map((asset) => {
      return {
        downloadUrl: asset["browser_download_url"],
        name: asset["name"],
      };
    }),
    etag: response.headers.get("etag") ?? "",
    currentVersion: result["tag_name"],
  };
}

async function downloadVersion({ assetName, toolPath }: Info, signal: AbortSignal, version: Version) {
  const asset = version.assets.find((x) => x.name === assetName);
  if (!asset) {
    throw new Error("No valid yt-dlp binary found");
  }

  const url = new URL(asset.downloadUrl);
  const response = await limiter(
    url,
    async () => {
      log.info(`Downloading lastest version: ${url}`);
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`GitHub error: ${response.status} - ${response.statusText}`);
      }

      return response;
    },
    DELAY,
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(toolPath, buffer, { mode: 0o755 });
  log.info(`Downloaded new version: ${toolPath}`);
}

function isWaitingForRetry({ retryAfter }: Config): boolean {
  if (!retryAfter) {
    return false;
  }

  const difference = Date.now() - retryAfter;
  if (difference > 0) {
    return false;
  }

  return true;
}

async function hasCachedVersion({ lastChecked }: Config, { toolPath }: Info): Promise<boolean> {
  const exists = await doesExist(toolPath);
  if (!exists) {
    return false;
  }

  const elapsed = Date.now() - lastChecked;
  const delay = CHECK_THRESHOLD - elapsed;
  return delay > 0;
}

function isSameVersion({ currentVersion }: Config, version: Version): boolean {
  if (version.currentVersion === currentVersion) {
    return true;
  }

  return false;
}

function getHeaders(config: Config): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/vnd.github+json");
  headers.set("User-Agent", USER_AGENT);

  if (config.personalAccessToken) {
    headers.set("Authorization", `Bearer ${decryptToken(config.personalAccessToken)}`);
  }

  if (config.etag) {
    headers.set("If-None-Match", config.etag);
  }

  return headers;
}

function applyToken(config: Config, token: string): Config {
  const personalAccessToken = encryptToken(token);
  return {
    ...config,
    personalAccessToken,
  };
}

function decryptToken(token: string): string {
  return safeStorage.decryptString(Buffer.from(token, "base64"));
}

function encryptToken(token: string): string {
  return safeStorage.encryptString(token).toString("base64");
}

async function buildInfo(): Promise<Info> {
  await fs.mkdir(getDataDirectory(), { recursive: true });
  const assetName = getAssetName("yt-dlp");
  const toolPath = getToolPath("yt-dlp");

  return { assetName, toolPath };
}

function getAssetName(toolType: ToolType): string {
  const platform = process.platform;
  const name = TOOLS.get(toolType)?.assetNames?.get(platform);
  if (!name) {
    throw new Error("Unsupported platform");
  }

  return name;
}

function getToolPath(toolType: ToolType): string {
  return path.join(getToolDirectory(toolType), getToolName(toolType));
}

function getToolDirectory(toolType: ToolType): string {
  if (!TOOLS.get(toolType)?.assetNames) {
    return path.join(getResourcesDirectory(), "bin");
  }

  return getDataDirectory();
}

function getToolName(toolType: ToolType): string {
  const platform = process.platform;
  const name = TOOLS.get(toolType)?.toolNames?.get(platform);
  if (!name) {
    throw new Error("Unsupported platform");
  }

  return name;
}
