import { writeConfig, readConfig } from "./config";
import { Settings } from "../../shared/types";
import { safeStorage } from "electron";

export async function loadSettings(): Promise<Settings> {
  const config = await readConfig();
  const settings = {
    personalAccessToken: decryptToken(config.personalAccessToken),
  };

  return settings;
}

export async function saveSettings(settings: Settings) {
  const config = {
    personalAccessToken: encryptToken(settings.personalAccessToken),
  };

  await writeConfig(config);
}

function decryptToken(token: string): string {
  return safeStorage.decryptString(Buffer.from(token, "base64"));
}

function encryptToken(token: string): string {
  return safeStorage.encryptString(token).toString("base64");
}
