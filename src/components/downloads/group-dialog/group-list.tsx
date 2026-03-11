import { GroupRowSkeleton, GroupRow } from "./contents/group-row";
import { DialogContainer } from "../../ui/dialog-container";
import { DialogContents } from "../../ui/dialog-contents";
import { Release, Item } from "../../../../shared/types";
import { Button } from "../../ui/button";
import { Icon } from "../../ui/icon";

interface Props {
  onSelect: (release: Release) => void;
  onClose: () => void;
  items: Item[];
}

const NUM_SKELETONS = 6;

export function GroupList({ onSelect, onClose, items }: Props) {
  const isLoading = items.some((item) => item.itemStatus === "waiting" || item.itemStatus === "downloading" || item.itemStatus === "fetching");
  const releases = items.reduce<Release[]>((result, item, index) => {
    const releases = item.releases ?? [];
    if (index === 0) {
      return releases;
    }

    const ids = new Set(releases.map((x) => x.id));
    return result.filter((x) => ids.has(x.id));
  }, []);

  const hasReleases = releases.length > 0;

  return (
    <DialogContainer>
      <DialogContents>
        {isLoading && Array.from({ length: NUM_SKELETONS }).map((_, index) => <GroupRowSkeleton key={index} />)}
        {!isLoading && hasReleases && releases?.map((release, index) => <GroupRow onSelect={() => onSelect(release)} release={release} items={items} key={release.id ?? index} />)}
        {!isLoading && !hasReleases && (
          <div className="flex justify-center items-center min-h-64">
            <Icon className="size-5" icon="error">
              <p className="text-sm text-gray-400 truncate">No releases available</p>
            </Icon>
          </div>
        )}
      </DialogContents>
      <div className="w-full flex justify-center items-center">
        <Button onClick={onClose} variant="success" size="small" type="submit">
          Done
        </Button>
      </div>
    </DialogContainer>
  );
}
