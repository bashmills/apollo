import { Metadata, Release, Item } from "../../shared/types";
import { limiter } from "../utils/limiter";
import log from "electron-log/main";
import { app } from "electron";

export interface OverrideOptions {
  onUpdateItem: (newItem: Item) => void;
  onShowError: (error: unknown) => void;
  items: Item[];
  item: Item;
}

export interface CustomOptions {
  metadata: Metadata;
  item: Item;
}

export interface MetadataOptions {
  metadata?: Metadata;
  title?: string;
  id?: string;
}

interface Search {
  field: "recording" | "release" | "artist";
  value?: string;
}

interface Entry {
  close: string;
  index: number;
}

const MUSICBRAINZ_URL = "https://musicbrainz.org/ws/2/recording";
const USER_AGENT = `Apollo/${app.getVersion()} ( bashmills@proton.me )`;
const REMOVE_CHARACTERS = ['"', "&", "?"];
const BRACKETS = new Map<string, string>([
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
]);
const MAPPING_THRESHOLD = 0.005;
const SCORE_THRESHOLD = 50;
const TOTAL_THRESHOLD = 4;
const COUNT_THRESHOLD = 4;
const DELAY = 1200;

export async function searchCustomReleases(options: CustomOptions, signal: AbortSignal): Promise<string[]> {
  const { metadata, item } = options;
  const { id } = item;
  const releases = await fetchReleases({ metadata, id }, signal);
  const ids = releases.map((x) => x.id).filter((x) => x !== undefined);
  return ids;
}

export async function overrideDownload(options: OverrideOptions, signal: AbortSignal) {
  const { onUpdateItem, onShowError, items, item } = options;
  await performOverride(
    {
      onUpdateItem: (newItem: Item) => !signal.aborted && onUpdateItem(newItem),
      onShowError: (error: unknown) => !signal.aborted && onShowError(error),
      items,
      item,
    },
    signal,
  );
}

export async function fetchItemReleases(signal: AbortSignal, item: Item) {
  const { metadata, title, id } = item;
  const releases = await fetchReleases({ metadata, title, id }, signal);
  item.releases = releases;
}

export function sortAllReleases(items: Item[]) {
  const mapping = buildReleaseMapping(items);
  for (const item of items) {
    sortReleases(mapping, item);
  }
}

async function performOverride({ onUpdateItem, onShowError, items, item }: OverrideOptions, signal: AbortSignal) {
  try {
    if (item.itemStatus !== "fetching") {
      throw new Error(`Invalid status for item: ${item.id}`);
    }

    await fetchItemReleases(signal, item);
    const mapping = buildReleaseMapping(items);
    sortReleases(mapping, item);
    item.itemStatus = "downloaded";
    onUpdateItem(item);
  } catch (error) {
    item.itemStatus = "missing";
    onUpdateItem(item);
    onShowError(error);
  }
}

async function fetchReleases({ metadata, title, id }: MetadataOptions, signal: AbortSignal): Promise<Release[]> {
  const trackFunc = (value?: number): number | undefined => {
    return value !== undefined ? value + 1 : undefined;
  };

  const recording = metadata?.title ?? title;
  const cleaned = cleanBrackets(recording);
  const release = metadata?.album;
  const artist = metadata?.artist;

  const searches: Search[][] = [
    [
      { value: recording, field: "recording" },
      { value: release, field: "release" },
      { value: artist, field: "artist" },
    ],
    [
      { value: recording, field: "recording" },
      { value: artist, field: "artist" },
    ],
    [
      { value: recording, field: "recording" },
      { value: release, field: "release" },
    ],
    [
      { value: cleaned, field: "recording" },
      { value: release, field: "release" },
      { value: artist, field: "artist" },
    ],
    [
      { value: cleaned, field: "recording" },
      { value: artist, field: "artist" },
    ],
    [
      { value: cleaned, field: "recording" },
      { value: release, field: "release" },
    ],
    [{ value: recording, field: "recording" }],
    [{ value: cleaned, field: "recording" }],
  ];

  let data: object | null = null;

  for (let i = 0; i < searches.length; i++) {
    if (searches[i].some((x) => x.value === undefined)) {
      log.info(`${id} - Skipping ${i} search as not all values are valid`);
      continue;
    }

    const parts = searches[i].map(({ field, value }) => (value !== undefined ? `${field}:${cleanValue(value)}` : null)).filter((x) => x !== null);
    const query = parts.join(" AND ");
    if (query.length === 0) {
      log.warn(`${id} - Invalid query for search: ${i}`);
      continue;
    }

    log.info(`${id} - Using ${i} search for fetching releases...`);
    const url = new URL(MUSICBRAINZ_URL);
    url.searchParams.append("query", query);
    url.searchParams.append("fmt", "json");
    const response = await limiter(
      url,
      async () => {
        log.info(`${id} - Fetching releases: ${url}`);
        const response = await fetch(url, {
          headers: { "User-Agent": USER_AGENT },
          signal,
        });

        if (!response.ok) {
          throw new Error(`MusicBrainz error: ${response.status} - ${response.statusText}`);
        }

        return response;
      },
      DELAY,
    );

    const json = await response.json();
    if (json["recordings"].length === 0) {
      log.warn(`${id} - No results found using search: ${i}`);
      continue;
    }

    log.info(`${id} - Found results using search: ${i}`);
    data = json;
    break;
  }

  if (!data) {
    throw new Error(`No releases found for item: ${id}`);
  }

  const releases: Release[] = [];
  for (const recording of data["recordings"] ?? []) {
    for (const release of recording["releases"] ?? []) {
      releases.push({
        score: recording["score"],
        secondaryTypes: release["release-group"]?.["secondary-types"],
        primaryType: release["release-group"]?.["primary-type"],
        performer: release["artist-credit"]?.map((x) => x["name"] + (x["joinphrase"] ?? "")).join(""),
        artist: recording["artist-credit"]?.map((x) => x["name"] + (x["joinphrase"] ?? "")).join(""),
        album: release["title"],
        title: release["media"]?.at(0)?.["track"]?.at(0)?.["title"],
        country: release["country"],
        format: release["media"]?.at(0)?.["format"],
        status: release["status"],
        total: release["media"]?.at(0)?.["track-count"],
        track: trackFunc(release["media"]?.at(0)?.["track-offset"]),
        disc: release["media"]?.at(0)?.["position"],
        date: release["date"],
        group: release["release-group"]?.["id"],
        key: recording["id"],
        id: release["id"],
      });
    }
  }

  return releases;
}

function sortReleases(mapping: Map<string, number> | null, item: Item) {
  const mappingFunc = (a: Release, b: Release): number => {
    const getScore = (release: Release): number => {
      const count = release.id ? (mapping?.get(release.id) ?? 0) : 0;
      const total = release.total;
      if (!count || !total) {
        return 0;
      }

      if (total <= TOTAL_THRESHOLD) {
        return 0;
      }

      if (count <= COUNT_THRESHOLD) {
        return 0;
      }

      const confidence = Math.sqrt(Math.min(total, count));
      const accuracy = total > count ? count / total : total / count;
      return confidence * accuracy;
    };

    const aResult = getScore(a);
    const bResult = getScore(b);

    return bResult - aResult;
  };

  const notContainsFunc = (fn: (x: Release) => string[] | undefined, a: Release, b: Release, value: string): number => {
    const aResult = fn(a)?.includes(value);
    const bResult = fn(b)?.includes(value);

    if (!aResult && bResult) {
      return -1;
    }

    if (aResult && !bResult) {
      return 1;
    }

    return 0;
  };

  const matchFunc = (fn: (x: Release) => string | undefined, a: Release, b: Release, value: string): number => {
    if (fn(a) === undefined || fn(b) === undefined) {
      return 0;
    }

    const aResult = fn(a) === value;
    const bResult = fn(b) === value;

    if (aResult && !bResult) {
      return -1;
    }

    if (!aResult && bResult) {
      return 1;
    }

    return 0;
  };

  const existsFunc = (fn: (x: Release) => string | number | undefined, a: Release, b: Release): number => {
    const aResult = fn(a);
    const bResult = fn(b);

    if (aResult && !bResult) {
      return -1;
    }

    if (!aResult && bResult) {
      return 1;
    }

    return 0;
  };

  const scoreFunc = (a: Release, b: Release): number => {
    return (b.score ?? 0) - (a.score ?? 0);
  };

  item.releases = item.releases?.sort((a, b) => {
    let result = matchFunc((x) => x.status, a, b, "Official");
    if (result !== 0) {
      return result;
    }

    result = matchFunc((x) => x.format, a, b, "Digital Media");
    if (result !== 0) {
      return result;
    }

    result = matchFunc((x) => x.format, a, b, "CD");
    if (result !== 0) {
      return result;
    }

    result = mappingFunc(a, b);
    if (Math.abs(result) >= MAPPING_THRESHOLD) {
      return result;
    }

    const score = scoreFunc(a, b);
    if (Math.abs(score) >= SCORE_THRESHOLD) {
      return score;
    }

    result = notContainsFunc((x) => x.secondaryTypes, a, b, "Compilation");
    if (result !== 0) {
      return result;
    }

    result = matchFunc((x) => x.primaryType, a, b, "Album");
    if (result !== 0) {
      return result;
    }

    result = matchFunc((x) => x.country, a, b, "XW");
    if (result !== 0) {
      return result;
    }

    result = matchFunc((x) => x.country, a, b, "XE");
    if (result !== 0) {
      return result;
    }

    result = existsFunc((x) => x.total, a, b);
    if (result !== 0) {
      return result;
    }

    result = existsFunc((x) => x.track, a, b);
    if (result !== 0) {
      return result;
    }

    result = existsFunc((x) => x.disc, a, b);
    if (result !== 0) {
      return result;
    }

    result = existsFunc((x) => x.date, a, b);
    if (result !== 0) {
      return result;
    }

    if ((a.group ?? "") > (b.group ?? "")) {
      return -1;
    }

    if ((a.group ?? "") < (b.group ?? "")) {
      return 1;
    }

    if ((a.id ?? "") > (b.id ?? "")) {
      return -1;
    }

    if ((a.id ?? "") < (b.id ?? "")) {
      return 1;
    }

    return score;
  });
}

function buildReleaseMapping(items: Item[]): Map<string, number> {
  const mapping = new Map<string, number>();
  for (const item of items) {
    const seen = new Set<string>();
    for (const release of item.releases ?? []) {
      if (!release.id || seen.has(release.id)) {
        continue;
      }

      const current = mapping.get(release.id) ?? 0;
      mapping.set(release.id, current + 1);
      seen.add(release.id);
    }
  }

  return mapping;
}

function cleanValue(value: string): string {
  return REMOVE_CHARACTERS.reduce((v, c) => v.split(c).join(""), value);
}

function cleanBrackets(value?: string): string | undefined {
  if (value === undefined) {
    return value;
  }

  const brackets = parseBrackets(value);
  for (const bracket of brackets) {
    value = value.split(bracket).join("");
  }

  value = value.replaceAll("  ", " ");
  value = value.trim();
  return value;
}

function parseBrackets(value: string): string[] {
  const results: string[] = [];
  const entries: Entry[] = [];
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    const close = BRACKETS.get(char);
    if (close) {
      entries.push({ close, index });
      continue;
    }

    const entry = entries[entries.length - 1];
    if (!entry) {
      continue;
    }

    if (entry.close !== char) {
      continue;
    }

    const result = value.slice(entry.index, index + 1);
    results.push(result);
    entries.pop();
  }

  const sorted = results.sort((a, b) => b.length - a.length);
  return sorted;
}
