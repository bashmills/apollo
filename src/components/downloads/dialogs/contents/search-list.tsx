import { DialogContainer } from "../../../ui/dialog-container";
import { DialogContents } from "../../../ui/dialog-contents";
import { useHandlers } from "../../../../hooks/use-handlers";
import { Release, Item } from "../../../../../shared/types";
import { invokeWithSleep } from "../../../../utils/promise";
import { SearchRowSkeleton, SearchRow } from "./search-row";
import { useAppStore } from "../../../../store/app-store";
import { useEffect, useState } from "react";
import { Button } from "../../../ui/button";

interface Props {
  onRequestClose: () => void;
  release?: Release;
  item: Item;
}

const NUM_SKELETONS = 15;
const DELAY = 200;

export function SearchList({ onRequestClose, release, item }: Props) {
  const appStatus = useAppStore((x) => x.appStatus);
  const [selected, setSelected] = useState<string>();
  const [groups, setGroups] = useState<string[]>([]);
  const { handleSelectRelease } = useHandlers();

  const disabled = (item.itemStatus !== "downloaded" && item.itemStatus !== "missing") || appStatus !== "downloaded";
  const hasGroups = groups.length > 0;

  useEffect(() => {
    async function load() {
      const results = await invokeWithSleep(
        () =>
          window.backend?.searchCustomReleases(
            {
              artist: release?.artist,
              album: release?.album,
              title: release?.title,
            },
            item,
          ),
        DELAY,
      );

      setGroups(results);
    }

    load();
  }, [release, item]);

  const handleSelect = (value: string) => {
    if (selected === value) {
      setSelected(undefined);
    } else {
      setSelected(value);
    }
  };

  const handleApply = () => {
    if (selected && release) {
      release.group = selected;
    }

    if (!release) {
      return;
    }

    handleSelectRelease(release, item);
    onRequestClose();
  };

  return (
    <DialogContainer>
      <DialogContents>
        <div className="w-full grid grid-cols-[repeat(auto-fill,7rem)] justify-around gap-2">
          {hasGroups && groups.map((x, index) => <SearchRow onSelect={() => handleSelect(x)} selected={selected} group={x} key={x ?? index} />)}
          {!hasGroups && Array.from({ length: NUM_SKELETONS }).map((_, index) => <SearchRowSkeleton key={index} />)}
        </div>
      </DialogContents>
      <div className="w-full flex justify-center items-center">
        <Button onClick={handleApply} disabled={disabled} variant="primary" size="medium" type="button">
          Add Release
        </Button>
      </div>
    </DialogContainer>
  );
}
