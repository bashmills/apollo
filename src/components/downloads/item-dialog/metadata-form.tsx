import { sanitizeDate } from "../../../../shared/conversion";
import { DialogContainer } from "../../ui/dialog-container";
import { DialogContents } from "../../ui/dialog-contents";
import { useHandlers } from "../../../hooks/use-handlers";
import { Item } from "../../../../shared/types";
import { TextField } from "../../ui/text-field";
import { FormEvent, useState } from "react";
import { Button } from "../../ui/button";
import { toast } from "sonner";

interface Props {
  onRequestClose: () => void;
  item: Item;
}

export function MetadataForm({ onRequestClose, item }: Props) {
  const [performer, setPerformer] = useState(item.metadata?.performer ?? "");
  const [artist, setArtist] = useState(item.metadata?.artist ?? "");
  const [album, setAlbum] = useState(item.metadata?.album ?? "");
  const [title, setTitle] = useState(item.metadata?.title ?? "");
  const [date, setDate] = useState(item.metadata?.date ?? "");
  const { handleOverrideMetadata } = useHandlers();

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
          <TextField onChange={(x) => setDate(sanitizeDate(x))} placeholder="Date" value={date} label="date">
            Date
          </TextField>
        </DialogContents>
        <div className="w-full flex flex-col justify-center items-center">
          <Button variant="primary" size="medium" type="submit">
            Fetch Metadata
          </Button>
        </div>
      </DialogContainer>
    </form>
  );
}
