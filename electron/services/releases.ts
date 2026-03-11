import { Release, Item, Metadata } from "../../shared/types";
import { limiter } from "../utils/limiter";
import log from "electron-log/main";
import { app } from "electron";
import Fuse from "fuse.js";

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

interface MetadataOptions {
  metadata?: Metadata;
  title?: string;
  id?: string;
}

interface Search {
  field: "recording" | "release" | "artist";
  value?: string;
}

const MUSICBRAINZ_URL = "https://musicbrainz.org/ws/2/recording";
const USER_AGENT = `Apollo/${app.getVersion()} ( bashmills@proton.me )`;
const MAPPING_THRESHOLD = 0.005;
const SCORE_THRESHOLD = 0.5;
const TOTAL_THRESHOLD = 4;
const COUNT_THRESHOLD = 4;
const DELAY = 1000;

export async function searchCustomReleases(options: CustomOptions, signal: AbortSignal): Promise<Release[]> {
  const { metadata, item } = options;
  const { id } = item;
  const releases = await fetchReleases({ metadata, id }, signal);
  return releases;
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
  const artistFunc = (artist?: string): number | undefined => {
    return fuse
      .search({ artist: artist ?? "" })
      .map((x) => x.score ?? 1.0)
      .sort()
      .at(0);
  };

  const albumFunc = (album?: string): number | undefined => {
    return fuse
      .search({ album: album ?? "" })
      .map((x) => x.score ?? 1.0)
      .sort()
      .at(0);
  };

  const titleFunc = (title?: string): number | undefined => {
    return fuse
      .search({ title: title ?? "" })
      .map((x) => x.score ?? 1.0)
      .sort()
      .at(0);
  };

  const trackFunc = (value?: number): number | undefined => {
    return value !== undefined ? value + 1 : undefined;
  };

  const searches: Search[][] = [
    [
      { value: metadata?.title, field: "recording" },
      { value: metadata?.album, field: "release" },
      { value: metadata?.artist, field: "artist" },
    ],
    [
      { value: metadata?.title, field: "recording" },
      { value: metadata?.artist, field: "artist" },
    ],
    [
      { value: metadata?.title, field: "recording" },
      { value: metadata?.album, field: "release" },
    ],
    [{ value: metadata?.title, field: "recording" }],
    [{ value: title, field: "recording" }],
  ];

  let data: object | null = null;

  for (let i = 0; i < searches.length; i++) {
    const parts = searches[i].filter((x) => x.value !== undefined).map(({ field, value }) => `${field}:${value?.replace('"', "")}`);
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

    const result = await response.json();
    if (result["recordings"].length === 0) {
      log.warn(`${id} - No results found using search: ${i}`);
      continue;
    }

    log.info(`${id} - Found results using search: ${i}`);
    data = result;
    break;
  }

  if (!data) {
    throw new Error(`No releases found for item: ${id}`);
  }

  const releases: Release[] = [];
  for (const recording of data["recordings"] ?? []) {
    for (const release of recording["releases"] ?? []) {
      releases.push({
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
        id: release["id"],
      });
    }
  }

  const fuse = new Fuse([metadata], {
    keys: ["artist", "album", "title"],
    isCaseSensitive: false,
    ignoreDiacritics: true,
    includeScore: true,
  });

  for (const release of releases) {
    release.score = ((artistFunc(release.artist) ?? 1.0) + (albumFunc(release.album) ?? 1.0) + (titleFunc(release.title) ?? 1.0)) / 3.0;
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

      const confidence = count !== total ? Math.sqrt(count) : count;
      const accuracy = count / total;
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

  item.releases = item.releases?.sort((a, b) => {
    const score = (a.score ?? 1.0) - (b.score ?? 1.0);
    if (Math.abs(score) >= SCORE_THRESHOLD) {
      return score;
    }

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
