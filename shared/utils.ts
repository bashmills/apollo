import { Release, Item } from "./types";

// Metadata

export function getMetadataPerformer(item: Item): string {
  return item.playlistChannel ?? item.metadata?.performer ?? item.metadata?.artist ?? "Unknown Album Artist";
}

export function getMetadataArtist(item: Item): string {
  return item.channel ?? item.metadata?.artist ?? "Unknown Artist";
}

export function getMetadataAlbum(item: Item): string {
  return item.playlistTitle ?? item.metadata?.album ?? "Unknown Album";
}

export function getMetadataTitle(item: Item): string {
  return item.metadata?.title ?? item.title ?? "Unknown Title";
}

export function getMetadataTrack(item: Item): number | undefined {
  return item.playlistIndex;
}

export function getMetadataDisc(): number | undefined {
  return undefined;
}

export function getMetadataDate(item: Item): string | undefined {
  return item?.metadata?.date;
}

// Release

export function getReleasePerformer(release?: Release): string {
  return release?.performer ?? release?.artist ?? "Unknown Album Artist";
}

export function getReleaseArtist(release?: Release): string {
  return release?.artist ?? "Unknown Artist";
}

export function getReleaseAlbum(release?: Release): string {
  return release?.album ?? "Unknown Album";
}

export function getReleaseTitle(release?: Release): string {
  return release?.title ?? "Unknown Title";
}

export function getReleaseTrack(release?: Release): number | undefined {
  return release?.track;
}

export function getReleaseDisc(release?: Release): number | undefined {
  return release?.disc;
}

export function getReleaseDate(release?: Release): string | undefined {
  return release?.date;
}

// Item

export function getPerformer(item: Item): string {
  switch (item.metadataType) {
    case "musicbrainz":
      return getReleasePerformer(item.releases?.at(0));
    case "youtube":
      return getMetadataPerformer(item);
  }
}

export function getArtist(item: Item): string {
  switch (item.metadataType) {
    case "musicbrainz":
      return getReleaseArtist(item.releases?.at(0));
    case "youtube":
      return getMetadataArtist(item);
  }
}

export function getAlbum(item: Item): string {
  switch (item.metadataType) {
    case "musicbrainz":
      return getReleaseAlbum(item.releases?.at(0));
    case "youtube":
      return getMetadataAlbum(item);
  }
}

export function getTitle(item: Item): string {
  switch (item.metadataType) {
    case "musicbrainz":
      return getReleaseTitle(item.releases?.at(0));
    case "youtube":
      return getMetadataTitle(item);
  }
}

export function getTrack(item: Item): number | undefined {
  switch (item.metadataType) {
    case "musicbrainz":
      return getReleaseTrack(item.releases?.at(0));
    case "youtube":
      return getMetadataTrack(item);
  }
}

export function getDisc(item: Item): number | undefined {
  switch (item.metadataType) {
    case "musicbrainz":
      return getReleaseDisc(item.releases?.at(0));
    case "youtube":
      return getMetadataDisc();
  }
}

export function getDate(item: Item): string | undefined {
  switch (item.metadataType) {
    case "musicbrainz":
      return getReleaseDate(item.releases?.at(0));
    case "youtube":
      return getMetadataDate(item);
  }
}
