import { useHandlers } from "../../hooks/use-handlers";
import { TextField } from "../ui/text-field";
import { FormEvent, useState } from "react";
import { Button } from "../ui/button";
import { useAppStore } from "../../store/app-store";

const PLACEHOLDER = "https://music.youtube.com/playlist?list=OLAK5uy_nMjlCmokT89b9UhrFkht6X-2cWdS4nYNo";

export function FormView() {
  const appStatus = useAppStore((x) => x.appStatus);
  const { handleSubmit } = useHandlers();
  const [url, setUrl] = useState("");

  const onHandleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    handleSubmit(url);
  };

  return (
    <form className="flex flex-col justify-center items-center space-y-6" onSubmit={onHandleSubmit}>
      <TextField onChange={setUrl} placeholder={PLACEHOLDER} disabled={appStatus !== "waiting"} value={url} label="url" required hidden>
        Playlist URL
      </TextField>
      <Button variant="primary" size="large" disabled={!url} type="submit">
        Download
      </Button>
    </form>
  );
}
