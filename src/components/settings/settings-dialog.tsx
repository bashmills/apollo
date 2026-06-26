import { ButtonToggle, ToggleItem } from "../ui/button-toggle";
import { BrowserType, Versions } from "../../../shared/types";
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
  const [versions, setVersions] = useState<Versions | null>(null);
  const [workers, setWorkers] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadSettings() {
    const result = await window.backend.getSettings();
    if (!result) {
      return;
    }

    setPersonalAccessToken(result.personalAccessToken);
    setBrowserType(result.browserType);
    setLoading(false);
  }

  async function loadVersions() {
    const result = await window.backend.getVersions();
    setVersions(result);
  }

  const handleSave = async () => {
    await handleSaveSettings({ personalAccessToken, browserType });
  };

  const handleFetch = async () => {
    const result = await handleFetchLatest();
    if (result !== "fetched") {
      return;
    }

    await loadVersions();
  };

  const handleClear = async () => {
    await handleClearCache();
  };

  useEffect(() => {
    loadSettings();
    loadVersions();
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
              <TextField onChange={setPersonalAccessToken} placeholder="Token" disabled={loading} value={personalAccessToken} label="personalAccessToken" hidden>
                Token
              </TextField>
            </div>
            <div className="w-full flex flex-col justify-center items-center space-y-2">
              <div className="w-full text-center">
                <h3 className="font-semibold text-gray-200 truncate">Import Browser Cookies</h3>
              </div>
              <ButtonToggle onClick={setBrowserType} toggles={TOGGLES} disabled={loading} current={browserType} />
            </div>
            <div className="w-full flex flex-col justify-center items-center space-y-2">
              <div className="w-full text-center">
                <h3 className="font-semibold text-gray-200 truncate">Misc</h3>
              </div>
              <SettingsButton onCallback={() => handleFetch()} setWorkers={setWorkers} workers={workers} variant="primary" worker="latest">
                Fetch Latest Tools
              </SettingsButton>
              <p className="text-xs text-gray-500 truncate">{versions?.ytdlpVersion || "Tools Not Installed"}</p>
              <SettingsButton onCallback={() => handleClear()} setWorkers={setWorkers} workers={workers} variant="danger" worker="cache">
                Clear Cache
              </SettingsButton>
            </div>
          </div>
        </DialogContents>
        <div className="relative w-full flex flex-col justify-center items-center">
          <SettingsButton onCallback={handleSave} setWorkers={setWorkers} workers={workers} variant="success" worker="save">
            Save
          </SettingsButton>
          {versions && <p className="absolute bottom-0 translate-y-5 text-xs text-gray-500 truncate">{versions?.appVersion}</p>}
        </div>
      </DialogContainer>
    </Dialog>
  );
}
