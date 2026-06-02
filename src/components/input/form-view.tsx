import { ButtonToggle, ToggleItem } from "../ui/button-toggle";
import { useHandlers } from "../../hooks/use-handlers";
import { MetadataType } from "../../../shared/types";
import { useAppStore } from "../../store/app-store";
import { TextField } from "../ui/text-field";
import { FormEvent, useState } from "react";
import { Button } from "../ui/button";

const PLACEHOLDER = "https://music.youtube.com/playlist?list=OLAK5uy_nMjlCmokT89b9UhrFkht6X-2cWdS4nYNo";

export function FormView() {
  const metadataType = useAppStore((x) => x.metadataType);
  const { setMetadataType } = useAppStore.getState();
  const appStatus = useAppStore((x) => x.appStatus);
  const { handleSubmit } = useHandlers();
  const [url, setUrl] = useState("");

  const toggles: ToggleItem<MetadataType>[] = [
    { title: "MusicBrainz Metadata", key: "musicbrainz" },
    { title: "YouTube Metadata", key: "youtube" },
  ];

  const onHandleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    handleSubmit(url);
  };

  return (
    <form className="flex flex-col justify-center items-center space-y-6" onSubmit={onHandleSubmit}>
      <div className="w-full flex flex-col justify-center items-center space-y-2">
        <TextField onChange={setUrl} placeholder={PLACEHOLDER} disabled={appStatus !== "waiting"} value={url} label="url" required hidden>
          Playlist URL
        </TextField>
        <ButtonToggle onClick={setMetadataType} toggles={toggles} current={metadataType} />
      </div>
      <Button variant="primary" size="large" disabled={!url} type="submit">
        Download
      </Button>
    </form>
  );
}
