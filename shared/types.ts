export type ItemStatus = "waiting" | "downloading" | "fetching" | "downloaded" | "saving" | "saved" | "missing" | "failed";
export type AppStatus = "waiting" | "downloading" | "downloaded" | "saving" | "saved";
export type ImageType = "thumbnail" | "cover-art";

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
  id?: string;
}

export interface Metadata {
  performer?: string;
  artist?: string;
  album?: string;
  title?: string;
}

export interface Item {
  itemStatus: ItemStatus;
  thumbnailPath: string;
  downloadPath: string;
  imageType: ImageType;
  releases?: Release[];
  metadata?: Metadata;
  custom?: Release;
  playlist?: string;
  index?: number;
  title?: string;
  url?: string;
  id?: string;
}
