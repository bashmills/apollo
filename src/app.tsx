import { SettingsView } from "./components/settings/settings-view";
import { useBackendEvents } from "./hooks/use-backend-handlers";
import { HeaderView } from "./components/headers/header-view";
import { ItemsView } from "./components/downloads/items-view";
import { FormView } from "./components/input/form-view";
import { useAppStore } from "./store/app-store";
import { Tooltip } from "react-tooltip";
import { Toaster } from "sonner";

export function App() {
  const appStatus = useAppStore((x) => x.appStatus);

  useBackendEvents();

  return (
    <div className="relative w-full h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col justify-center items-center p-4">
      <Tooltip portalRoot={document.body} variant="dark" place="bottom" id="image-type" noArrow />
      <Toaster position="top-center" theme="dark" closeButton richColors />
      {appStatus === "waiting" && <SettingsView />}
      <div className="w-full flex flex-col max-h-full max-w-5xl backdrop-blur-sm rounded-2xl shadow-2xl space-y-8 p-8 border border-gray-700/50 bg-gray-800/80">
        <HeaderView />
        {appStatus !== "waiting" && <ItemsView />}
        {appStatus === "waiting" && <FormView />}
      </div>
    </div>
  );
}
