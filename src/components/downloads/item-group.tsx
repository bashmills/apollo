import { getReleasePerformer, getReleaseAlbum, getUniqueKey } from "../../../shared/utils";
import { ImageType, Item } from "../../../shared/types";
import { MouseEvent, useEffect, useState } from "react";
import { DetailedButton } from "../ui/detailed-button";
import { useHandlers } from "../../hooks/use-handlers";
import { GroupDialog } from "./dialogs/group-dialog";
import { useAppStore } from "../../store/app-store";
import { ImageSwitch } from "../ui/image-switch";
import { IconButton } from "../ui/icon-button";
import { ItemRow } from "./item-row";

interface Props {
  items: Item[];
}

export function ItemGroup({ items }: Props) {
  const [imageType, setImageType] = useState<ImageType>("cover-art");
  const appStatus = useAppStore((x) => x.appStatus);
  const { handleApplyImageTypes } = useHandlers();
  const [expanded, setExpanded] = useState(true);
  const [open, setOpen] = useState(false);

  const release = items.at(0)?.releases?.at(0);
  const total = getTotalTracks(items);
  const count = items.length;

  const variant = release ? (!hasDuplicates(items) ? (total === count ? "success" : "warning") : "error") : "pending";
  const canOpen = appStatus === "downloading" || appStatus === "downloaded";
  const matches = total ? `${count} / ${total}` : count;
  const thumbnail = items.at(0)?.playlistId;
  const coverArt = release?.group;

  const handleToggleExpanded = (event: MouseEvent<HTMLButtonElement>) => {
    setExpanded((prev) => !prev);
    event.stopPropagation();
  };

  const handleApplyImageTypesCallback = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (appStatus !== "downloaded") {
      return;
    }

    const newImageType = imageType !== "thumbnail" ? "thumbnail" : "cover-art";
    handleApplyImageTypes(items, newImageType);
    setImageType(newImageType);
  };

  const handleShowGroupDialog = () => {
    if (!canOpen) {
      return;
    }

    setOpen(true);
  };

  useEffect(() => {
    const setThumbnailImageType = imageType !== "thumbnail" ? items.every((i) => i.imageType === "thumbnail") : false;
    const setCoverArtImageType = imageType !== "cover-art" ? items.every((i) => i.imageType === "cover-art") : false;

    if (setThumbnailImageType) {
      setImageType("thumbnail");
    }

    if (setCoverArtImageType) {
      setImageType("cover-art");
    }
  }, [imageType, items]);

  useEffect(() => {
    if (!canOpen && open) {
      setOpen(false);
    }
  }, [canOpen, open]);

  return (
    <>
      {canOpen && open && <GroupDialog onClose={() => setOpen(false)} release={release} items={items} />}
      <div className={`transition-all duration-200 ${expanded ? "space-y-2" : "space-y-0"}`}>
        <DetailedButton onClick={handleShowGroupDialog} disabled={!canOpen} variant={variant}>
          <div className="flex items-center gap-x-3">
            <div className="shrink-0">
              <ImageSwitch className="size-24" onClick={handleApplyImageTypesCallback} imageType={imageType} thumbnail={thumbnail} coverArt={coverArt} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium text-gray-200 truncate">{getReleaseAlbum(release)}</p>
              <p className="text-sm text-gray-400 truncate">{getReleasePerformer(release)}</p>
              <p className="text-sm text-gray-400 truncate">{matches}</p>
            </div>
            <div className="shrink-0">
              <IconButton onClick={handleToggleExpanded} icon={!expanded ? "arrow-down" : "arrow-up"} />
            </div>
          </div>
        </DetailedButton>
        <div className={`overflow-hidden origin-top pl-8 transition-all duration-200 ${!expanded ? "pointer-events-none max-h-0 scale-y-0 opacity-0 space-y-0" : "scale-y-100 opacity-100 space-y-2"}`}>
          {items.map((item, index) => (
            <ItemRow item={item} key={item.id ?? index} />
          ))}
        </div>
      </div>
    </>
  );
}

function getTotalTracks(items: Item[]): number {
  const seen = new Set<number>();
  let result = 0;
  for (const item of items) {
    const total = item.releases?.at(0)?.total;
    const disc = item.releases?.at(0)?.disc;
    if (total === undefined || disc === undefined) {
      continue;
    }

    if (seen.has(disc)) {
      continue;
    }

    result += total;
    seen.add(disc);
  }

  return result;
}

function hasDuplicates(items: Item[]): boolean {
  const seen = new Set<string>();
  for (const item of items) {
    const key = getUniqueKey(item.releases?.at(0));
    if (key === null) {
      continue;
    }

    if (seen.has(key)) {
      return true;
    }

    seen.add(key);
  }

  return false;
}
