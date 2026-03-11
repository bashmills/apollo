import { useAppStore } from "../../store/app-store";
import { SettingsDialog } from "./settings-dialog";
import { IconButton } from "../ui/icon-button";
import { useEffect, useState } from "react";

export function SettingsView() {
  const appStatus = useAppStore((x) => x.appStatus);
  const [open, setOpen] = useState(false);

  const canOpen = appStatus === "waiting";

  useEffect(() => {
    if (!canOpen && open) {
      setOpen(false);
    }
  }, [canOpen, open]);

  return (
    <>
      {canOpen && open && <SettingsDialog onClose={() => setOpen(false)} />}
      {canOpen && (
        <div className="absolute top-4 right-4 z-20">
          <IconButton onClick={() => setOpen(true)} icon="settings" />
        </div>
      )}
    </>
  );
}
