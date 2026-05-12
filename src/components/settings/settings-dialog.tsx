import { DialogContainer } from "../ui/dialog-container";
import { DialogContents } from "../ui/dialog-contents";
import { useHandlers } from "../../hooks/use-handlers";
import { SettingsButton } from "./settings-button";
import { Settings } from "../../../shared/types";
import { TextField } from "../ui/text-field";
import { useEffect, useState } from "react";
import { Dialog } from "../ui/dialog";

interface Props {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: Props) {
  const { handleSaveSettings, handleFetchLatest, handleClearCache } = useHandlers();
  const [workers, setWorkers] = useState<string[]>([]);
  const [version, setVersion] = useState<string>();
  const [visible, setVisible] = useState(false);
  const [token, setToken] = useState("");

  const onSave = async () => {
    await handleSaveSettings({ personalAccessToken: token });
  };

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const value: Settings = await window.backend.getSettings();
      if (mounted && value) {
        setToken(value.personalAccessToken);
      }
    }

    async function loadVersion() {
      const version = await window.backend.getVersion();
      if (mounted) {
        setVersion(version);
      }
    }

    loadSettings();
    loadVersion();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Dialog onSetVisible={setVisible} onClose={onClose} visible={visible} title="Settings">
      <DialogContainer>
        <DialogContents>
          <div className="w-full flex flex-col justify-center items-center space-y-6">
            <div className="w-full flex flex-col justify-center items-center space-y-2">
              <div className="w-full text-center">
                <h3 className="font-semibold text-gray-200 truncate">Github Personal Access Token</h3>
              </div>
              <TextField onChange={setToken} placeholder="Token" value={token} label="token" hidden>
                Token
              </TextField>
              <SettingsButton onCallback={onSave} setWorkers={setWorkers} workers={workers} variant="primary" worker={"token"}>
                Save Token
              </SettingsButton>
            </div>
            <div className="w-full flex flex-col justify-center items-center space-y-2">
              <div className="w-full text-center">
                <h3 className="font-semibold text-gray-200 truncate">Tools</h3>
              </div>
              <SettingsButton onCallback={() => handleFetchLatest()} setWorkers={setWorkers} workers={workers} variant="primary" worker={"latest"}>
                Fetch Latest
              </SettingsButton>
            </div>
            <div className="w-full flex flex-col justify-center items-center space-y-2">
              <div className="w-full text-center">
                <h3 className="font-semibold text-gray-200 truncate">Cache</h3>
              </div>
              <SettingsButton onCallback={() => handleClearCache()} setWorkers={setWorkers} workers={workers} variant="danger" worker={"cache"}>
                Clear Cache
              </SettingsButton>
            </div>
          </div>
        </DialogContents>
        <div className="relative w-full flex flex-col justify-center items-center">
          <SettingsButton onCallback={onSave} setWorkers={setWorkers} workers={workers} variant="success" worker={"save"}>
            Save
          </SettingsButton>
          {version && <p className="absolute bottom-0 translate-y-5 text-xs text-gray-500 truncate">{version}</p>}
        </div>
      </DialogContainer>
    </Dialog>
  );
}
