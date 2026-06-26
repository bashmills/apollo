import { getResourcesDirectory, getDataDirectory, doesExist } from "../utils/os";
import { NotModifiedError, RateLimitError } from "../errors";
import { FetchResult, Settings } from "../../shared/types";
import { State, writeState, readState } from "./state";
import { limiter } from "../utils/limiter";
import { loadSettings } from "./settings";
import log from "electron-log/main";
import { app } from "electron";
import fs from "fs/promises";
import path from "path";

type ToolName = "yt-dlp" | "ffmpeg" | "deno";
type ToolType = "download" | "bundled";

export interface ToolPaths {
  ytdlp: string;
  ffmpeg: string;
  deno: string;
}

interface ResponseJson {
  tag_name?: string;
  assets?: {
    browser_download_url?: string;
    name?: string;
  }[];
}

interface Tool {
  assetNames?: Map<NodeJS.Platform, string>;
  toolNames: Map<NodeJS.Platform, string>;
  toolType: ToolType;
}

interface Info {
  assetName: string;
  toolPath: string;
}

interface Version {
  latest: string;
  assets: Asset[];
  etag: string;
}

interface Asset {
  downloadUrl: string;
  name: string;
}

const TOOLS = new Map<ToolName, Tool>([
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
      toolType: "download",
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
      toolType: "bundled",
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
      toolType: "bundled",
    },
  ],
]);

const GITHUB_API_URL = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";
const USER_AGENT = `Apollo/${app.getVersion()} ( bashmills@proton.me )`;
const CHECK_THRESHOLD = 1000 * 60;
const DELAY = 1200;

export async function checkLatestVersion(signal: AbortSignal): Promise<FetchResult> {
  const settings = await loadSettings();
  const state = await readState();
  const lastChecked = Date.now();

  try {
    if (isWaitingForRetry(state)) {
      throw new Error("Waiting for rate limit retry time");
    }

    const info = await buildInfo();
    if (await hasCachedVersion(state, info)) {
      log.info(`Using cached yt-dlp version: ${state.ytdlpVersion}`);
      return "not-fetched";
    }

    const version = await fetchLatestVersion(signal, settings, state);
    if (isSameVersion(state, version)) {
      throw new NotModifiedError();
    }

    log.info(`Downloading new yt-dlp version: ${version.latest}`);
    await downloadVersion(info, signal, version);
    log.info(`Using new yt-dlp version: ${version.latest}`);
    const ytdlpVersion = version.latest;
    const { etag } = version;

    await writeState({
      ...state,
      ytdlpVersion,
      lastChecked,
      etag,
    });
  } catch (error) {
    if (error instanceof NotModifiedError) {
      log.info(`Using same yt-dlp version: ${state.ytdlpVersion}`);
      await writeState({
        ...state,
        lastChecked,
      });

      return "not-fetched";
    }

    if (error instanceof RateLimitError) {
      const { retryAfter } = error;
      await writeState({
        ...state,
        lastChecked,
        retryAfter,
      });
    }

    throw error;
  }

  return "fetched";
}

export function getToolPaths(): ToolPaths {
  const getPath = (toolName: ToolName): string => {
    const toolPath = getToolPath(toolName);
    log.info(`Tool: ${toolName} = ${toolPath}`);
    return toolPath;
  };

  return {
    ytdlp: getPath("yt-dlp"),
    ffmpeg: getPath("ffmpeg"),
    deno: getPath("deno"),
  };
}

async function fetchLatestVersion(signal: AbortSignal, settings: Settings, state: State): Promise<Version> {
  const url = new URL(GITHUB_API_URL);
  const response = await limiter(
    url,
    async () => {
      log.info(`Fetching lastest version: ${url}`);
      const headers = getHeaders(settings, state);
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

  const json = (await response.json()) as ResponseJson;
  const { headers } = response;
  if (!json) {
    throw new Error("No latest yt-dlp version found");
  }

  const latest = json.tag_name ?? "";
  const assets =
    json.assets?.map((asset) => {
      return {
        downloadUrl: asset.browser_download_url ?? "",
        name: asset.name ?? "",
      };
    }) ?? [];
  const etag = headers.get("etag") ?? "";

  return {
    latest,
    assets,
    etag,
  };
}

async function downloadVersion({ assetName, toolPath }: Info, signal: AbortSignal, version: Version) {
  const asset = version.assets.find((x) => x.name === assetName);
  if (!asset?.downloadUrl) {
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

function isWaitingForRetry({ retryAfter }: State): boolean {
  if (!retryAfter) {
    return false;
  }

  const difference = Date.now() - retryAfter;
  if (difference > 0) {
    return false;
  }

  return true;
}

async function hasCachedVersion({ lastChecked }: State, { toolPath }: Info): Promise<boolean> {
  const exists = await doesExist(toolPath);
  if (!exists) {
    return false;
  }

  const elapsed = Date.now() - lastChecked;
  const delay = CHECK_THRESHOLD - elapsed;
  return delay > 0;
}

function isSameVersion({ ytdlpVersion }: State, version: Version): boolean {
  if (version.latest === ytdlpVersion) {
    return true;
  }

  return false;
}

function getHeaders(settings: Settings, state: State): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/vnd.github+json");
  headers.set("User-Agent", USER_AGENT);

  if (settings.personalAccessToken) {
    headers.set("Authorization", `Bearer ${settings.personalAccessToken}`);
  }

  if (state.etag) {
    headers.set("If-None-Match", state.etag);
  }

  return headers;
}

async function buildInfo(): Promise<Info> {
  await fs.mkdir(getDataDirectory(), { recursive: true });
  const assetName = getAssetName("yt-dlp");
  const toolPath = getToolPath("yt-dlp");

  return { assetName, toolPath };
}

function getAssetName(toolName: ToolName): string {
  const platform = process.platform;
  const name = TOOLS.get(toolName)?.assetNames?.get(platform);
  if (!name) {
    throw new Error("Unsupported platform");
  }

  return name;
}

function getToolPath(toolName: ToolName): string {
  return path.join(getToolDirectory(toolName), getToolName(toolName));
}

function getToolName(toolName: ToolName): string {
  const platform = process.platform;
  const name = TOOLS.get(toolName)?.toolNames?.get(platform);
  if (!name) {
    throw new Error("Unsupported platform");
  }

  return name;
}

function getToolDirectory(toolName: ToolName): string {
  const type = TOOLS.get(toolName)?.toolType;
  if (!type) {
    throw new Error("Unsupported platform");
  }

  if (type === "bundled") {
    return path.join(getResourcesDirectory(), "bin");
  }

  return getDataDirectory();
}
