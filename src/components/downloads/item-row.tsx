import { DetailedButton, Variant } from "../ui/detailed-button";
import { ItemStatus, Item } from "../../../shared/types";
import { MouseEvent, useEffect, useState } from "react";
import { useHandlers } from "../../hooks/use-handlers";
import { useAppStore } from "../../store/app-store";
import { ImageSwitch } from "../ui/image-switch";
import { ItemDialog } from "./item-dialog";
import { ItemBadge } from "./item-badge";

interface Props {
  item: Item;
}

const DETAILED_BUTTON_VARIANTS = new Map<ItemStatus, Variant>([
  ["waiting", "pending"],
  ["downloading", "working"],
  ["fetching", "working"],
  ["downloaded", "success"],
  ["saving", "working"],
  ["saved", "success"],
  ["missing", "warning"],
  ["failed", "error"],
]);

export function ItemRow({ item }: Props) {
  const appStatus = useAppStore((x) => x.appStatus);
  const { handleToggleImageType } = useHandlers();
  const [open, setOpen] = useState(false);

  const variant = DETAILED_BUTTON_VARIANTS.get(item.itemStatus) ?? "pending";
  const canOpen = appStatus === "downloading" || appStatus === "downloaded";
  const release = item.releases?.at(0);
  const imageType = item.imageType;
  const thumbnail = item.id;
  const coverArt = release?.group;

  const handleShowItemDialog = () => {
    if (!canOpen) {
      return;
    }

    setOpen(true);
  };

  const handleToggleImageTypeCallback = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (appStatus !== "downloaded") {
      return;
    }

    handleToggleImageType(item);
  };

  useEffect(() => {
    if (!canOpen && open) {
      setOpen(false);
    }
  }, [canOpen, open]);

  return (
    <>
      {canOpen && open && <ItemDialog onClose={() => setOpen(false)} item={item} />}
      <DetailedButton onClick={handleShowItemDialog} disabled={!canOpen} variant={variant}>
        <div className="flex items-center gap-x-3">
          <div className="shrink-0">
            <ImageSwitch className="size-12" onClick={handleToggleImageTypeCallback} imageType={imageType} thumbnail={thumbnail} coverArt={coverArt} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium truncate">{item.title ?? "Invalid Title"}</p>
            {(appStatus === "downloaded" || appStatus === "saving" || appStatus === "saved") && (
              <>
                <p className="font-medium text-gray-200 truncate">{release?.title ?? "Unknown Title"}</p>
                <p className="text-sm text-gray-400 truncate">{release?.artist ?? "Unknown Artist"}</p>
              </>
            )}
          </div>
          <div className="shrink-0">
            <ItemBadge item={item} />
          </div>
        </div>
      </DetailedButton>
    </>
  );
}

export function ItemRowSkeleton() {
  return (
    <div className="w-full p-4 rounded-xl border bg-gray-700/10 border-gray-600/30 animate-pulse">
      <div className="flex items-center gap-x-3">
        <div className="size-12 shrink-0">
          <div className="size-full rounded-md bg-gray-500/70 animate-pulse"></div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-6 w-5/6 rounded bg-gray-500/60 animate-pulse"></div>
        </div>
        <div className="shrink-0">
          <div className="size-5 rounded-md bg-gray-500/30 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
