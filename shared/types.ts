export type ItemStatus = "waiting" | "downloading" | "fetching" | "downloaded" | "saving" | "saved" | "missing" | "failed";
export type AppStatus = "waiting" | "downloading" | "downloaded" | "saving" | "saved";
export type MetadataType = "musicbrainz" | "youtube";
export type ImageType = "thumbnail" | "cover-art";

export interface Settings {
  personalAccessToken: string;
}

export interface Release {
  score?: number;
  secondaryTypes?: string[];
  primaryType?: string;
  performer?: string;
  artist?: string;
  album?: string;
  title?: string;
  country?: string;
  format?: string;
  status?: string;
  total?: number;
  track?: number;
  disc?: number;
  date?: string;
  group?: string;
  key?: string;
  id?: string;
}

export interface Metadata {
  performer?: string;
  artist?: string;
  album?: string;
  title?: string;
  date?: string;
}

export interface Item {
  metadataType: MetadataType;
  itemStatus: ItemStatus;
  thumbnailPath: string;
  downloadPath: string;
  imageType: ImageType;
  releases?: Release[];
  metadata?: Metadata;
  custom?: Release;
  playlistChannel?: string;
  playlistTitle?: string;
  playlistIndex?: number;
  playlistId?: string;
  channel?: string;
  title?: string;
  url?: string;
  id?: string;
}
