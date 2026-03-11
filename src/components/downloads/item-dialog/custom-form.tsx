import { DialogContainer } from "../../ui/dialog-container";
import { DialogContents } from "../../ui/dialog-contents";
import { useHandlers } from "../../../hooks/use-handlers";
import { Item, Release } from "../../../../shared/types";
import { TextField } from "../../ui/text-field";
import { Button } from "../../ui/button";
import { useState } from "react";
import { toast } from "sonner";

type InputError = "performer" | "artist" | "album" | "title";

interface Props {
  onRequestClose: () => void;
  onSearch: (release: Release) => void;
  item: Item;
}

const NUMBER_REGEX = new RegExp("[^0-9]", "g");

export function CustomForm({ onRequestClose, onSearch, item }: Props) {
  const [performer, setPerformer] = useState(item.custom?.performer ?? item.metadata?.performer ?? item.metadata?.artist ?? "");
  const [artist, setArtist] = useState(item.custom?.artist ?? item.metadata?.artist ?? "");
  const [album, setAlbum] = useState(item.custom?.album ?? item.metadata?.album ?? "");
  const [title, setTitle] = useState(item.custom?.title ?? item.metadata?.title ?? "");
  const [track, setTrack] = useState(item.custom?.track?.toString() ?? "");
  const [disc, setDisc] = useState(item.custom?.disc?.toString() ?? "");
  const [date, setDate] = useState(item.custom?.date ?? "");
  const [errors, setErrors] = useState<Map<InputError, string>>(new Map());
  const { handleSelectRelease, handleCustomRelease } = useHandlers();

  const release: Release = {
    performer,
    artist,
    album,
    title,
    track: convertInt(track),
    disc: convertInt(disc),
    date,
  };

  const validationFunc = (): boolean => {
    const newErrors: Map<InputError, string> = new Map();
    if (!performer) {
      newErrors.set("performer", "This is a required field");
      toast.error("Album Artist is a required field");
    }

    if (!artist) {
      newErrors.set("artist", "This is a required field");
      toast.error("Artist is a required field");
    }

    if (!album) {
      newErrors.set("album", "This is a required field");
      toast.error("Album is a required field");
    }

    if (!title) {
      newErrors.set("title", "This is a required field");
      toast.error("Title is a required field");
    }

    setErrors(newErrors);

    if (newErrors.size > 0) {
      return false;
    }

    return true;
  };

  const handleRequiredField = (callback: () => void, error: InputError) => {
    if (errors.has(error)) {
      const newErrors = new Map(errors);
      newErrors.delete(error);
      setErrors(newErrors);
    }

    callback();
  };

  const handleBlurCapture = () => {
    handleCustomRelease(release, item);
  };

  const handleSearch = () => {
    if (!validationFunc()) {
      return;
    }

    onSearch(release);
  };

  const handleApply = () => {
    if (!validationFunc()) {
      return;
    }

    handleSelectRelease(release, item);
    onRequestClose();
  };

  return (
    <form className="w-full flex flex-col justify-center items-center min-h-0" onBlurCapture={handleBlurCapture}>
      <DialogContainer>
        <DialogContents>
          <TextField onChange={(x) => handleRequiredField(() => setPerformer(x), "performer")} placeholder="Album Aritst" error={errors.get("performer")} value={performer} label="album-artist" required>
            Album Artist
          </TextField>
          <TextField onChange={(x) => handleRequiredField(() => setArtist(x), "artist")} placeholder="Artist" error={errors.get("artist")} value={artist} label="artist" required>
            Artist
          </TextField>
          <TextField onChange={(x) => handleRequiredField(() => setAlbum(x), "album")} placeholder="Album" error={errors.get("album")} value={album} label="album" required>
            Album
          </TextField>
          <TextField onChange={(x) => handleRequiredField(() => setTitle(x), "title")} placeholder="Title" error={errors.get("title")} value={title} label="title" required>
            Title
          </TextField>
          <TextField onChange={(x) => setTrack(sanitizeInt(x))} placeholder="Track" inputMode="numeric" value={track} label="track" type="number">
            Track
          </TextField>
          <TextField onChange={(x) => setDisc(sanitizeInt(x))} placeholder="Disc" inputMode="numeric" value={disc} label="disc" type="number">
            Disc
          </TextField>
          <TextField onChange={(x) => setDate(sanitizeDate(x))} placeholder="Date" value={date} label="date">
            Date
          </TextField>
        </DialogContents>
        <div className="w-full flex flex-col justify-center items-center space-y-2">
          <Button onClick={handleSearch} variant="primary" size="medium" type="button">
            Search Cover Art
          </Button>
          <Button onClick={handleApply} variant="primary" size="medium" type="button">
            Add Release
          </Button>
        </div>
      </DialogContainer>
    </form>
  );
}

function sanitizeDate(value: string): string {
  const digits = sanitizeInt(value).slice(0, 8);
  if (digits.length > 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }

  if (digits.length > 4) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return digits;
}

function sanitizeInt(value: string): string {
  return value.replace(NUMBER_REGEX, "");
}

function convertInt(value: string): number {
  return Number(sanitizeInt(value));
}
