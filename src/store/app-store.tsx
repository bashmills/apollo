import { MetadataType, AppStatus, ItemStatus, ImageType, Metadata, Release, Item } from "../../shared/types";
import { create } from "zustand";

interface AppState {
  applyImageTypes: (itemIds: Set<string | undefined>, imageType: ImageType) => void;
  toggleImageType: (itemId?: string) => void;

  updateReleases: (itemIds: Set<string | undefined>, releaseId?: string) => void;
  updateRelease: (release: Release, itemId?: string) => void;

  updateMetadata: (metadata: Metadata, itemId?: string) => void;
  updateCustom: (custom: Release, itemId?: string) => void;
  updateItem: (item: Item) => void;

  updateAppStatus: (appStatus: AppStatus, items: Item[]) => void;
  setMetadataType: (metadataType: MetadataType) => void;
  setAppStatus: (appStatus: AppStatus) => void;
  setItems: (items: Item[]) => void;
  reset: () => void;

  metadataType: MetadataType;
  appStatus: AppStatus;
  items: Item[];
}

export const useAppStore = create<AppState>((set) => ({
  applyImageTypes: (itemIds: Set<string | undefined>, imageType: ImageType) =>
    set((state) => ({
      items: state.items.map((item) =>
        itemIds.has(item.id)
          ? {
              ...item,
              imageType,
            }
          : item,
      ),
    })),

  toggleImageType: (itemId?: string) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              imageType: item.imageType !== "thumbnail" ? "thumbnail" : "cover-art",
            }
          : item,
      ),
    })),

  updateReleases: (itemIds: Set<string | undefined>, releaseId?: string) =>
    set((state) => ({
      items: state.items.map((item) =>
        itemIds.has(item.id)
          ? {
              ...item,
              releases: [...(item.releases ?? []).filter((x) => releaseId === x.id), ...(item.releases ?? []).filter((x) => releaseId !== x.id)],
              itemStatus: "downloaded" as ItemStatus,
            }
          : item,
      ),
    })),

  updateRelease: (release: Release, itemId?: string) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              releases: [release, ...(item.releases ?? []).filter((x) => release.id !== x.id)],
              itemStatus: "downloaded" as ItemStatus,
            }
          : item,
      ),
    })),

  updateMetadata: (metadata: Metadata, itemId?: string) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              metadata,
            }
          : item,
      ),
    })),

  updateCustom: (custom: Release, itemId?: string) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              custom,
            }
          : item,
      ),
    })),

  updateItem: (item: Item) =>
    set((state) => ({
      items: state.items.map((x) => {
        return item.id === x.id ? item : x;
      }),
    })),

  updateAppStatus: (appStatus: AppStatus, items: Item[]) => set({ appStatus, items }),
  setMetadataType: (metadataType: MetadataType) => set({ metadataType }),
  setAppStatus: (appStatus: AppStatus) => set({ appStatus }),
  setItems: (items: Item[]) => set({ items }),
  reset: () => set({ metadataType: "musicbrainz", appStatus: "waiting", items: [] }),

  metadataType: "musicbrainz",
  appStatus: "waiting",
  items: [],
}));
