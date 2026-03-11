import { ImageType, Release, Item } from "../../../shared/types";
import { MouseEvent, useEffect, useState } from "react";
import { DetailedButton } from "../ui/detailed-button";
import { useHandlers } from "../../hooks/use-handlers";
import { useAppStore } from "../../store/app-store";
import { ImageSwitch } from "../ui/image-switch";
import { IconButton } from "../ui/icon-button";
import { GroupDialog } from "./group-dialog";
import { ItemRow } from "./item-row";

interface Props {
  release?: Release;
  items: Item[];
}

export function ItemGroup({ release, items }: Props) {
  const [imageType, setImageType] = useState<ImageType>("cover-art");
  const appStatus = useAppStore((x) => x.appStatus);
  const { handleApplyImageTypes } = useHandlers();
  const [expanded, setExpanded] = useState(true);
  const [open, setOpen] = useState(false);

  const variant = release ? (release.total === items.length ? "success" : "warning") : "error";
  const matches = release?.total ? `${items.length} / ${release.total}` : items.length;
  const canOpen = appStatus === "downloading" || appStatus === "downloaded";
  const thumbnail = items.at(0)?.playlist;
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
    const allThumbnail = items.every((i) => i.imageType === "thumbnail");
    const allCoverArt = items.every((i) => i.imageType === "cover-art");

    if (allThumbnail) {
      setImageType("thumbnail");
    }

    if (allCoverArt) {
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
              <p className="font-medium text-gray-200 truncate">{release?.album ?? "Unknown Album"}</p>
              <p className="text-sm text-gray-400 truncate">{release?.performer ?? release?.artist ?? "Unknown Album Artist"}</p>
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
