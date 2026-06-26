import { getDataDirectory } from "../utils/os";
import fs from "fs/promises";
import path from "path";

export interface State {
  ytdlpVersion: string;
  lastChecked: number;
  retryAfter?: number;
  etag: string;
}

interface Info {
  statePath: string;
}

const STATE_FILENAME = "state.json";

export async function writeState(state: State) {
  const data = JSON.stringify(state);
  const info = await buildInfo();
  await write(info, data);
}

export async function readState(): Promise<State> {
  const info = await buildInfo();
  const state = await read(info);
  if (!state) {
    return createEmptyState();
  }

  return state;
}

async function write({ statePath }: Info, data: string) {
  await fs.writeFile(statePath, data, "utf-8");
}

async function read({ statePath }: Info): Promise<State | null> {
  try {
    const data = await fs.readFile(statePath, "utf-8");
    const state = JSON.parse(data) as State;
    return state;
  } catch {
    return null;
  }
}

async function buildInfo(): Promise<Info> {
  await fs.mkdir(getDataDirectory(), { recursive: true });
  const statePath = getStatePath();

  return {
    statePath,
  };
}

function getStatePath(): string {
  return path.join(getDataDirectory(), STATE_FILENAME);
}

function createEmptyState(): State {
  return {
    ytdlpVersion: "",
    lastChecked: 0,
    etag: "",
  };
}
