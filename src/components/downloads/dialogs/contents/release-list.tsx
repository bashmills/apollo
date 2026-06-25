import { useDialogStore } from "../../../../hooks/use-dialog-store";
import { useDialogState } from "../../../../hooks/use-dialog-state";
import { ReleaseRowSkeleton, ReleaseRow } from "./release-row";
import { DialogContainer } from "../../../ui/dialog-container";
import { PersistContents } from "../../../ui/persist-contents";
import { Release, Item } from "../../../../../shared/types";
import { getUniqueKey } from "../../../../../shared/utils";
import { useAppStore } from "../../../../store/app-store";
import { TextField } from "../../../ui/text-field";
import { Button } from "../../../ui/button";
import { Icon } from "../../../ui/icon";

type ListState = "loading" | "showing" | "empty" | "none";

interface Props {
  onSelect: (release: Release) => void;
  onOverride: () => void;
  onCustom: () => void;
  item: Item;
}

const DIALOG_STORE_ID = "release-list";
const NUM_SKELETONS = 3;

export function ReleaseList({ onOverride, onCustom, onSelect, item }: Props) {
  const { setFilter } = useDialogStore(DIALOG_STORE_ID).getState();
  const filter = useDialogState(DIALOG_STORE_ID, (x) => x.filter);
  const appStatus = useAppStore((x) => x.appStatus);

  const matchFilter = (toMatch?: string): boolean => {
    if (toMatch) {
      return toMatch.toLowerCase().includes(filter.toLowerCase());
    }

    return false;
  };

  const isLoading = item.itemStatus === "waiting" || item.itemStatus === "downloading" || item.itemStatus === "fetching";
  const filtered = item.releases?.filter((x) => matchFilter(x.performer) || matchFilter(x.artist) || matchFilter(x.album) || matchFilter(x.title) || matchFilter(x.group) || matchFilter(x.key) || matchFilter(x.id));
  const hasReleases = (item.releases?.length ?? 0) > 0;
  const hasMatch = (filtered?.length ?? 0) > 0;

  const calculateState = (): ListState => {
    if (isLoading) {
      return "loading";
    }

    if (!hasReleases) {
      return "empty";
    }

    if (!hasMatch) {
      return "none";
    }

    return "showing";
  };

  const disabled = (item.itemStatus !== "downloaded" && item.itemStatus !== "missing") || appStatus !== "downloaded";
  const state = calculateState();

  const canFilter = (state === "showing" || state === "none") && !disabled;

  return (
    <DialogContainer>
      <div className="w-full flex flex-1 flex-col justify-center items-center min-h-0 space-y-2">
        <TextField onChange={setFilter} placeholder="Filter" disabled={!canFilter} value={filter} label="filter" required hidden>
          Filter
        </TextField>
        <PersistContents id={DIALOG_STORE_ID}>
          {state === "showing" && filtered?.map((release, index) => <ReleaseRow onSelect={() => onSelect(release)} release={release} key={getUniqueKey(release) ?? index} />)}
          {state === "loading" && Array.from({ length: NUM_SKELETONS }).map((_, index) => <ReleaseRowSkeleton key={index} />)}
          {state === "empty" && (
            <div className="size-full flex justify-center items-center">
              <Icon className="size-5" icon="error">
                <p className="text-sm text-gray-400 truncate">No releases available</p>
              </Icon>
            </div>
          )}
          {state === "none" && (
            <div className="size-full flex justify-center items-center">
              <Icon className="size-5" icon="info">
                <p className="text-sm text-gray-400 truncate">No matching releases</p>
              </Icon>
            </div>
          )}
        </PersistContents>
      </div>
      <div className="w-full flex flex-col justify-center items-center space-y-2">
        <Button onClick={onOverride} disabled={disabled} variant="primary" size="medium" type="button">
          Override Metadata
        </Button>
        <Button onClick={onCustom} disabled={disabled} variant="primary" size="medium" type="button">
          Custom Release
        </Button>
      </div>
    </DialogContainer>
  );
}
