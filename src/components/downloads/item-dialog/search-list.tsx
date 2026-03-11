import { SearchRowSkeleton, SearchRow } from "./contents/search-row";
import { DialogContainer } from "../../ui/dialog-container";
import { DialogContents } from "../../ui/dialog-contents";
import { useHandlers } from "../../../hooks/use-handlers";
import { Release, Item } from "../../../../shared/types";
import { invokeWithSleep } from "../../../utils/promise";
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";

interface Props {
  onRequestClose: () => void;
  release?: Release;
  item: Item;
}

const NUM_SKELETONS = 15;
const DELAY = 500;

export function SearchList({ onRequestClose, release, item }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [selected, setSelected] = useState<Release>();
  const { handleSelectRelease } = useHandlers();

  const hasReleases = releases.length > 0;

  useEffect(() => {
    let mounted = true;

    async function load() {
      const result = await invokeWithSleep(
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

      if (!mounted) {
        return;
      }

      const groups = result.map((x) => x.group).filter((x) => x);
      const unique = [...new Set<string>(groups)];
      const value = unique.map((x) => {
        return { group: x };
      });

      setReleases(value);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [release, item]);

  const handleSelect = (value: Release) => {
    if (selected?.group === value?.group) {
      setSelected(undefined);
    } else {
      setSelected(value);
    }
  };

  const handleApply = () => {
    if (selected?.group && release) {
      release.group = selected.group;
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
          {hasReleases && releases.map((x, index) => <SearchRow onSelect={() => handleSelect(x)} selected={selected} release={x} key={x?.id ?? index} />)}
          {!hasReleases && Array.from({ length: NUM_SKELETONS }).map((_, index) => <SearchRowSkeleton key={index} />)}
        </div>
      </DialogContents>
      <div className="w-full flex justify-center items-center">
        <Button onClick={handleApply} variant="primary" size="medium" type="button">
          Add Release
        </Button>
      </div>
    </DialogContainer>
  );
}
