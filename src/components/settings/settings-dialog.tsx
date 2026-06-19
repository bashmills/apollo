import { ButtonToggle, ToggleItem } from "../ui/button-toggle";
import { BrowserType, Settings } from "../../../shared/types";
import { DialogContainer } from "../ui/dialog-container";
import { DialogContents } from "../ui/dialog-contents";
import { useHandlers } from "../../hooks/use-handlers";
import { SettingsButton } from "./settings-button";
import { TextField } from "../ui/text-field";
import { useEffect, useState } from "react";
import { Dialog } from "../ui/dialog";

interface Props {
  onClose: () => void;
}

const TOGGLES: ToggleItem<BrowserType>[] = [
  { title: "Firefox", key: "firefox" },
  { title: "Chrome", key: "chrome" },
  { title: "Safari", key: "safari" },
  { title: "None", key: "none" },
];

export function SettingsDialog({ onClose }: Props) {
  const { handleSaveSettings, handleFetchLatest, handleClearCache } = useHandlers();
  const [personalAccessToken, setPersonalAccessToken] = useState("");
  const [browserType, setBrowserType] = useState<BrowserType>("none");
  const [workers, setWorkers] = useState<string[]>([]);
  const [version, setVersion] = useState<string>();
  const [visible, setVisible] = useState(false);

  const onSave = async () => {
    await handleSaveSettings({ personalAccessToken, browserType });
  };

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const value: Settings = await window.backend.getSettings();
      if (mounted && value) {
        setPersonalAccessToken(value.personalAccessToken);
        setBrowserType(value.browserType);
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
                <h3 className="font-semibold text-gray-200 truncate">GitHub Personal Access Token</h3>
              </div>
              <TextField onChange={setPersonalAccessToken} placeholder="Token" value={personalAccessToken} label="personalAccessToken" hidden>
                Token
              </TextField>
            </div>
            <div className="w-full flex flex-col justify-center items-center space-y-2">
              <div className="w-full text-center">
                <h3 className="font-semibold text-gray-200 truncate">Import Browser Cookies</h3>
              </div>
              <ButtonToggle onClick={setBrowserType} toggles={TOGGLES} current={browserType} />
            </div>
            <div className="w-full flex flex-col justify-center items-center space-y-2">
              <div className="w-full text-center">
                <h3 className="font-semibold text-gray-200 truncate">Misc</h3>
              </div>
              <SettingsButton onCallback={() => handleFetchLatest()} setWorkers={setWorkers} workers={workers} variant="primary" worker="latest">
                Fetch Latest Tools
              </SettingsButton>
              <SettingsButton onCallback={() => handleClearCache()} setWorkers={setWorkers} workers={workers} variant="danger" worker="cache">
                Clear Cache
              </SettingsButton>
            </div>
          </div>
        </DialogContents>
        <div className="relative w-full flex flex-col justify-center items-center">
          <SettingsButton onCallback={onSave} setWorkers={setWorkers} workers={workers} variant="success" worker="save">
            Save
          </SettingsButton>
          {version && <p className="absolute bottom-0 translate-y-5 text-xs text-gray-500 truncate">{version}</p>}
        </div>
      </DialogContainer>
    </Dialog>
  );
}
