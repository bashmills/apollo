import { DetailedButton } from "../../../ui/detailed-button";
import { Release } from "../../../../../shared/types";
import { CoverArt } from "../../../ui/cover-art";

interface Props {
  onSelect: () => void;
  release: Release;
}

export function ReleaseRow({ onSelect, release }: Props) {
  return (
    <DetailedButton onClick={onSelect} variant="pending">
      <div className="flex items-center gap-x-3">
        <div className="shrink-0">
          <CoverArt className="size-12" id={release.group} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-gray-200 truncate">{release.title ?? "Unknown Title"}</p>
          <p className="text-sm text-gray-400 truncate">{release.performer ?? release?.artist ?? "Unknown Album Aritst"}</p>
          <p className="text-sm text-gray-400 truncate">{release.artist ?? "Unknown Artist"}</p>
          <p className="text-sm text-gray-400 truncate">{release.album ?? "Unknown Album"}</p>
        </div>
      </div>
    </DetailedButton>
  );
}

export function ReleaseRowSkeleton() {
  return (
    <div className="w-full p-4 rounded-xl border bg-gray-700/10 border-gray-600/30 animate-pulse">
      <div className="flex items-center gap-x-3">
        <div className="size-12 shrink-0">
          <div className="size-full rounded-md bg-gray-500/70 animate-pulse"></div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-5 w-5/6 rounded bg-gray-500/60 animate-pulse"></div>
          <div className="h-4 w-2/6 rounded bg-gray-500/50 animate-pulse"></div>
          <div className="h-4 w-3/6 rounded bg-gray-500/40 animate-pulse"></div>
          <div className="h-4 w-4/6 rounded bg-gray-500/30 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
