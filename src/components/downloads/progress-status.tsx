import { useAppStore } from "../../store/app-store";

export function ProgressStatus() {
  const appStatus = useAppStore((x) => x.appStatus);
  const items = useAppStore((x) => x.items);

  return (
    <div className="w-full flex justify-between items-center gap-4">
      <h2 className="text-lg font-semibold text-gray-200 truncate">Playlist items ({items.length})</h2>
      <div className="flex min-w-0 gap-2">
        {(appStatus === "waiting" || appStatus === "downloading" || appStatus === "downloaded") && <span className="text-xs text-gray-400 truncate">{items.filter((i) => i.itemStatus === "downloaded").length} downloaded</span>}
        {(appStatus === "saving" || appStatus === "saved") && <span className="text-xs text-gray-400 truncate">{items.filter((i) => i.itemStatus === "saved").length} saved</span>}
        <span className="text-xs text-gray-400 truncate">•</span>
        <span className="text-xs text-gray-400 truncate">{items.filter((i) => i.itemStatus === "missing").length} missing</span>
        <span className="text-xs text-gray-400 truncate">•</span>
        <span className="text-xs text-gray-400 truncate">{items.filter((i) => i.itemStatus === "failed").length} failed</span>
      </div>
    </div>
  );
}
