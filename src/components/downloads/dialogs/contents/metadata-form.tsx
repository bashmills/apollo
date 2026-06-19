import { getPerformer, getArtist, getAlbum, getTitle } from "../../../../../shared/utils";
import { DialogContainer } from "../../../ui/dialog-container";
import { DialogContents } from "../../../ui/dialog-contents";
import { useHandlers } from "../../../../hooks/use-handlers";
import { useAppStore } from "../../../../store/app-store";
import { Item } from "../../../../../shared/types";
import { TextField } from "../../../ui/text-field";
import { FormEvent, useState } from "react";
import { Button } from "../../../ui/button";
import { toast } from "sonner";

interface Props {
  onRequestClose: () => void;
  item: Item;
}

export function MetadataForm({ onRequestClose, item }: Props) {
  const [performer, setPerformer] = useState(getInitialPerformer(item));
  const [artist, setArtist] = useState(getInitialArtist(item));
  const [album, setAlbum] = useState(getInitialAlbum(item));
  const [title, setTitle] = useState(getInitialTitle(item));
  const appStatus = useAppStore((x) => x.appStatus);
  const { handleOverrideMetadata } = useHandlers();

  const disabled = (item.itemStatus !== "downloaded" && item.itemStatus !== "missing") || appStatus !== "downloaded";
  const text = item.metadataType === "youtube" ? "Override Metadata" : "Fetch Metadata";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!artist && !album && !title) {
      toast.error("Invalid metadata input");
      return;
    }

    if (!item.id) {
      return;
    }

    handleOverrideMetadata({ performer, artist, album, title }, item);
    onRequestClose();
  };

  return (
    <form className="w-full flex flex-col justify-center items-center min-h-0" onSubmit={handleSubmit}>
      <DialogContainer>
        <DialogContents>
          <TextField onChange={setPerformer} placeholder="Album Artist" value={performer} label="album-artist">
            Album Artist
          </TextField>
          <TextField onChange={setArtist} placeholder="Artist" value={artist} label="artist">
            Artist
          </TextField>
          <TextField onChange={setAlbum} placeholder="Album" value={album} label="album">
            Album
          </TextField>
          <TextField onChange={setTitle} placeholder="Title" value={title} label="title">
            Title
          </TextField>
        </DialogContents>
        <div className="w-full flex flex-col justify-center items-center">
          <Button disabled={disabled} variant="primary" size="medium" type="submit">
            {text}
          </Button>
        </div>
      </DialogContainer>
    </form>
  );
}

function getInitialPerformer(item: Item): string {
  if (item.metadataType === "musicbrainz") {
    return item.metadata?.performer ?? "";
  }

  return getPerformer(item);
}

function getInitialArtist(item: Item): string {
  if (item.metadataType === "musicbrainz") {
    return item.metadata?.artist ?? "";
  }

  return getArtist(item);
}

function getInitialAlbum(item: Item): string {
  if (item.metadataType === "musicbrainz") {
    return item.metadata?.album ?? "";
  }

  return getAlbum(item);
}

function getInitialTitle(item: Item): string {
  if (item.metadataType === "musicbrainz") {
    return item.metadata?.title ?? "";
  }

  return getTitle(item);
}
