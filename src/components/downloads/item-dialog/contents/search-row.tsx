import { Release } from "../../../../../shared/types";
import { CoverArt } from "../../../ui/cover-art";

interface Props {
  onSelect: () => void;
  selected?: Release;
  release: Release;
}

export function SearchRow({ onSelect, selected, release }: Props) {
  return (
    <button className={`size-28 flex justify-center items-center rounded-xl shadow-lg transition-all duration-100 border bg-gray-700/10 hover:bg-gray-600/20 ${selected?.group !== release.group ? "border-gray-600/30" : "border-yellow-400"}`} onClick={onSelect} type="button">
      <CoverArt className="size-24" id={release.group} />
    </button>
  );
}

export function SearchRowSkeleton() {
  return (
    <div className="size-28 flex justify-center items-center rounded-xl border bg-gray-700/10 border-gray-600/30 animate-pulse">
      <div className="size-24">
        <div className="size-full rounded-md bg-gray-500/70 animate-pulse"></div>
      </div>
    </div>
  );
}
