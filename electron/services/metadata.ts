import { Promise as ID3, TagConstants } from "node-id3";
import { getThumbnailPath } from "./thumbnail";
import { getCoverArtPath } from "./cover-art";
import { doesExist } from "../utils/os";
import { Item } from "../../shared/types";
import { AbortError } from "../errors";
import log from "electron-log/main";
import fs from "fs/promises";

export async function exportItemMetadata(filepath: string, item: Item) {
  if (!filepath) {
    throw new Error("Invalid filepath to export");
  }

  const release = item.releases?.at(0);
  if (!release) {
    throw new Error("Invalid release");
  }

  log.info(`${item.id} - Exporting metadata: ${filepath}`);
  const year = release.date?.slice(0, 4);
  const path = item.imageType === "thumbnail" ? getThumbnailPath(release.id) : getCoverArtPath(release.id);
  const exists = await doesExist(path);
  const hasImage = exists && path;
  const image = hasImage
    ? {
        type: {
          id: TagConstants.AttachedPicture.PictureType.FRONT_COVER,
        },
        imageBuffer: await fs.readFile(path),
        description: "Front cover",
        mime: "image/jpeg",
      }
    : undefined;

  await ID3.write(
    {
      performerInfo: release.performer ?? release.artist,
      artist: release.artist,
      title: release.title,
      album: release.album,
      trackNumber: release.track?.toString(),
      partOfSet: release.disc?.toString(),
      date: release.date,
      image,
      year,
    },
    filepath,
  );
}

export async function importItemMetadata(signal: AbortSignal, item: Item) {
  if (!item.downloadPath) {
    throw new Error(`Invalid filepath for item: ${item.id}`);
  }

  if (signal.aborted) {
    throw new AbortError();
  }

  log.info(`${item.id} - Importing metadata: ${item.downloadPath}`);
  const tags = await ID3.read(item.downloadPath);

  item.metadata = {
    performer: tags.performerInfo,
    artist: tags.artist,
    album: tags.album,
    title: tags.title,
  };
}
