import { getPerformer, getArtist, getAlbum, getTitle, getTrack, getDisc, getDate } from "../../shared/utils";
import { Promise as ID3, TagConstants } from "node-id3";
import { sanitizeDate } from "../../shared/conversion";
import { getThumbnailPath } from "./thumbnail";
import { getCoverArtPath } from "./cover-art";
import { Item } from "../../shared/types";
import { doesExist } from "../utils/os";
import { AbortError } from "../errors";
import log from "electron-log/main";
import fs from "fs/promises";

export async function exportItemMetadata(filepath: string, item: Item) {
  if (!filepath) {
    throw new Error("Invalid filepath to export");
  }

  log.info(`${item.id} - Exporting metadata: ${filepath}`);
  const path = item.imageType === "thumbnail" ? getThumbnailPath(getThumbnailId(item)) : getCoverArtPath(getCoverArtId(item));
  const exists = await doesExist(path);
  const hasImage = exists && path;

  const trackNumber = getTrack(item)?.toString();
  const partOfSet = getDisc(item)?.toString();
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
  const year = getDate(item)?.slice(0, 4);

  await ID3.write(
    {
      performerInfo: getPerformer(item),
      artist: getArtist(item),
      album: getAlbum(item),
      title: getTitle(item),
      trackNumber,
      partOfSet,
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
  const time = tags.originalReleaseTime ?? tags.releaseTime ?? tags.recordingTime ?? "";
  const date = sanitizeDate(time);

  item.metadata = {
    performer: tags.performerInfo,
    artist: tags.artist,
    album: tags.album,
    title: tags.title,
    date,
  };
}

function getThumbnailId(item: Item): string | undefined {
  return item.id;
}

function getCoverArtId(item: Item): string | undefined {
  return item.releases?.at(0)?.group;
}
