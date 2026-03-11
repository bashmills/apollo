import { getDataDirectory } from "../utils/os";
import fs from "fs/promises";
import path from "path";

export interface Config {
  personalAccessToken: string;
  currentVersion: string;
  lastChecked: number;
  retryAfter?: number;
  etag: string;
}

interface Info {
  configPath: string;
}

const CONFIG_FILENAME = "config.json";

export async function writeConfig(config: Config) {
  const data = JSON.stringify(config);
  const info = await buildInfo();
  await write(info, data);
}

export async function readConfig(): Promise<Config> {
  const info = await buildInfo();
  const config = await read(info);
  if (!config) {
    return createEmptyConfig();
  }

  return config;
}

async function write({ configPath }: Info, data: string) {
  await fs.writeFile(configPath, data, "utf-8");
}

async function read({ configPath }: Info): Promise<Config | null> {
  try {
    const data = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(data);
    return config;
  } catch {
    return null;
  }
}

async function buildInfo(): Promise<Info> {
  await fs.mkdir(getDataDirectory(), { recursive: true });
  const configPath = getConfigPath();

  return {
    configPath,
  };
}

function getConfigPath(): string {
  return path.join(getDataDirectory(), CONFIG_FILENAME);
}

function createEmptyConfig(): Config {
  return {
    personalAccessToken: "",
    currentVersion: "",
    lastChecked: 0,
    etag: "",
  };
}
