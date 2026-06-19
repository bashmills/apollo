import { ReleaseRowSkeleton, ReleaseRow } from "./release-row";
import { DialogContainer } from "../../../ui/dialog-container";
import { DialogContents } from "../../../ui/dialog-contents";
import { Release, Item } from "../../../../../shared/types";
import { getUniqueKey } from "../../../../../shared/utils";
import { useAppStore } from "../../../../store/app-store";
import { Button } from "../../../ui/button";
import { Icon } from "../../../ui/icon";

interface Props {
  onSelect: (release: Release) => void;
  onOverride: () => void;
  onCustom: () => void;
  item: Item;
}

const NUM_SKELETONS = 3;

export function ReleaseList({ onOverride, onCustom, onSelect, item }: Props) {
  const isLoading = item.itemStatus === "waiting" || item.itemStatus === "downloading" || item.itemStatus === "fetching";
  const hasReleases = (item.releases?.length ?? 0) > 0;
  const appStatus = useAppStore((x) => x.appStatus);

  const disabled = (item.itemStatus !== "downloaded" && item.itemStatus !== "missing") || appStatus !== "downloaded";

  return (
    <DialogContainer>
      <DialogContents>
        {!isLoading && hasReleases && item.releases?.map((release, index) => <ReleaseRow onSelect={() => onSelect(release)} release={release} key={getUniqueKey(release) ?? index} />)}
        {isLoading && Array.from({ length: NUM_SKELETONS }).map((_, index) => <ReleaseRowSkeleton key={index} />)}
        {!isLoading && !hasReleases && (
          <div className="flex justify-center items-center min-h-64">
            <Icon className="size-5" icon="error">
              <p className="text-sm text-gray-400 truncate">No releases available</p>
            </Icon>
          </div>
        )}
      </DialogContents>
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
