import { useDialogStore } from "../../../../hooks/use-dialog-store";
import { useDialogState } from "../../../../hooks/use-dialog-state";
import { DialogContainer } from "../../../ui/dialog-container";
import { PersistContents } from "../../../ui/persist-contents";
import { Release, Item } from "../../../../../shared/types";
import { useAppStore } from "../../../../store/app-store";
import { GroupRowSkeleton, GroupRow } from "./group-row";
import { TextField } from "../../../ui/text-field";
import { Button } from "../../../ui/button";
import { Icon } from "../../../ui/icon";

type ListState = "loading" | "showing" | "empty" | "none";

interface Props {
  onSelect: (release: Release) => void;
  onClose: () => void;
  items: Item[];
}

const DIALOG_STORE_ID = "group-list";
const NUM_SKELETONS = 6;

export function GroupList({ onSelect, onClose, items }: Props) {
  const { setFilter } = useDialogStore(DIALOG_STORE_ID).getState();
  const filter = useDialogState(DIALOG_STORE_ID, (x) => x.filter);
  const appStatus = useAppStore((x) => x.appStatus);

  const releases = items.reduce<Release[]>((result, item, index) => {
    const releases = item.releases ?? [];
    if (index === 0) {
      return releases;
    }

    const ids = new Set(releases.map((x) => x.id));
    return result.filter((x) => ids.has(x.id));
  }, []);

  const matchFilter = (toMatch?: string): boolean => {
    if (toMatch) {
      return toMatch.toLowerCase().includes(filter.toLowerCase());
    }

    return false;
  };

  const isLoading = items.some((item) => item.itemStatus === "waiting" || item.itemStatus === "downloading" || item.itemStatus === "fetching");
  const filtered = releases.filter((x) => matchFilter(x.performer) || matchFilter(x.album) || matchFilter(x.group) || matchFilter(x.id));
  const hasReleases = (releases?.length ?? 0) > 0;
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

  const disabled = appStatus !== "downloaded";
  const state = calculateState();

  const canFilter = (state === "showing" || state === "none") && !disabled;

  return (
    <DialogContainer>
      <div className="w-full flex flex-1 flex-col justify-center items-center min-h-0 space-y-2">
        <TextField onChange={setFilter} placeholder="Filter" disabled={!canFilter} value={filter} label="filter" required hidden reset>
          Filter
        </TextField>
        <PersistContents id={DIALOG_STORE_ID}>
          {state === "showing" && filtered.map((release, index) => <GroupRow onSelect={() => onSelect(release)} release={release} key={release.id ?? index} />)}
          {state === "loading" && Array.from({ length: NUM_SKELETONS }).map((_, index) => <GroupRowSkeleton key={index} />)}
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
      <div className="w-full flex justify-center items-center">
        <Button onClick={onClose} variant="success" size="small" type="submit">
          Done
        </Button>
      </div>
    </DialogContainer>
  );
}
