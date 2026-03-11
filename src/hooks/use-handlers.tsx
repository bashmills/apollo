import { ItemStatus, ImageType, Metadata, Release, Item } from "../../shared/types";
import { invokeWithSleep } from "../utils/promise";
import { useAppStore } from "../store/app-store";
import { toast } from "sonner";
import log from "electron-log/renderer";

const DELAY = 500;

export function useHandlers() {
  const { applyImageTypes, toggleImageType, updateReleases, updateRelease, updateCustom, updateStatus, setAppStatus, reset } = useAppStore.getState();

  return {
    // Apply image types handler
    handleApplyImageTypes: (items: Item[], imageType: ImageType) => {
      log.info(`Handling apply image types: ${items.length}`);
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "downloaded") {
        log.error(`Incorrect status for apply image types: ${appStatus}`);
        return;
      }

      const itemIds = new Set(items.map((x) => x?.id));
      applyImageTypes(itemIds, imageType);
      log.info("Handle apply image types success");
    },

    // Toggle image type handler
    handleToggleImageType: (item: Item) => {
      log.info(`Handling toggle image type: ${item.id}`);
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "downloaded") {
        log.error(`Incorrect status for toggle image type: ${appStatus}`);
        return;
      }

      toggleImageType(item.id);
      log.info("Handle toggle image type success");
    },

    // Override metadata handler
    handleOverrideMetadata: async (metadata: Metadata, item: Item) => {
      log.info("Handling override metadata...");
      const { appStatus, items } = useAppStore.getState();
      if (appStatus !== "downloaded") {
        log.error(`Incorrect status for override metadata: ${appStatus}`);
        return;
      }

      const newItem = { ...item, releases: [], metadata, itemStatus: "fetching" as ItemStatus };
      const newItems = items.map((x) => (newItem.id === x.id ? newItem : x));
      updateStatus("downloading", newItems);

      const success = await invokeWithSleep(() => window.backend?.overrideDownload(newItems, newItem), DELAY);
      if (!success) {
        log.info("Handle override metadata failed");
        reset();
        return;
      }

      toast.success("Override complete");
      setAppStatus("downloaded");
      log.info("Handle override metadata success");
    },

    // Select releases handler
    handleSelectReleases: (release: Release, items: Item[]) => {
      log.info("Handling select releases...");
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "downloaded") {
        log.error(`Incorrect status for select releases: ${appStatus}`);
        return;
      }

      const itemIds = new Set(items.map((x) => x?.id));
      updateReleases(itemIds, release.id);
      log.info("Handle select releases success");
    },

    // Select release handler
    handleSelectRelease: (release: Release, item: Item) => {
      log.info("Handling select release...");
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "downloaded") {
        log.error(`Incorrect status for select release: ${appStatus}`);
        return;
      }

      updateRelease(release, item.id);
      log.info("Handle select release success");
    },

    // Custom release handler
    handleCustomRelease: (custom: Release, item: Item) => {
      log.info("Handling custom release...");
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "downloaded") {
        log.error(`Incorrect status for custom release: ${appStatus}`);
        return;
      }

      updateCustom(custom, item.id);
      log.info("Handle custom release success");
    },

    // Submit handler
    handleSubmit: async (url: string) => {
      log.info(`Handling submit: ${url}`);
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "waiting") {
        log.error(`Incorrect status for submit: ${appStatus}`);
        return;
      }

      updateStatus("downloading", []);

      const success = await invokeWithSleep(() => window.backend?.startDownload(url), DELAY);
      if (!success) {
        log.info("Handle submit failed");
        reset();
        return;
      }

      toast.success("Downloads complete");
      setAppStatus("downloaded");
      log.info("Handle submit success");
    },

    // Retry handler
    handleRetry: async () => {
      log.info("Handling retry...");
      const { appStatus, items } = useAppStore.getState();
      if (appStatus !== "downloaded") {
        log.error(`Incorrect status for retry: ${appStatus}`);
        return;
      }

      const newItems = items.map((item) => (item.itemStatus === "missing" || item.itemStatus === "failed" ? { ...item, itemStatus: "waiting" as ItemStatus } : item));
      updateStatus("downloading", newItems);

      const success = await invokeWithSleep(() => window.backend?.retryDownload(newItems), DELAY);
      if (!success) {
        log.info("Handle retry failed");
        reset();
        return;
      }

      toast.success("Downloads complete");
      setAppStatus("downloaded");
      log.info("Handle retry success");
    },

    // Cancel handler
    handleCancel: async () => {
      log.info("Handling cancel...");
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "downloading") {
        log.error(`Incorrect status for cancel: ${appStatus}`);
        return;
      }

      const success = await window.backend?.stopDownload();
      if (!success) {
        log.info("Handle cancel failed");
        return;
      }

      log.info("Handle cancel success");
    },

    // Save handler
    handleSave: async () => {
      log.info("Handling save...");
      const { appStatus, items } = useAppStore.getState();
      if (appStatus !== "downloaded") {
        log.error(`Incorrect status for save: ${appStatus}`);
        return;
      }

      const folder = await window.backend?.chooseFolder();
      if (!folder) {
        log.info("Handle save canceled");
        return;
      }

      const newItems = items.map((item) => (item.itemStatus === "downloaded" ? { ...item, itemStatus: "saving" as ItemStatus } : item));
      updateStatus("saving", newItems);

      const success = await invokeWithSleep(() => window.backend?.exportDownload(newItems, folder), DELAY);
      if (!success) {
        log.info("Handle save failed");
        reset();
        return;
      }

      toast.success("Save complete");
      setAppStatus("saved");
      log.info("Handle save success");
    },

    // Reset handler
    handleReset: () => {
      log.info("Handling reset...");
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "downloaded" && appStatus !== "saved") {
        log.error(`Incorrect status for reset: ${appStatus}`);
        return;
      }

      toast.info("Downloads reset");
      reset();
      log.info("Handle reset success");
    },

    // Save personal access token handler
    handleSavePersonalAccessToken: async (token: string) => {
      log.info(`Handling save personal access token: ${token}`);
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "waiting") {
        log.error(`Incorrect status for saving personal access token: ${appStatus}`);
        return;
      }

      const success = await invokeWithSleep(() => window.backend?.savePersonalAccessToken(token), DELAY);
      if (!success) {
        log.info("Handle save personal access token failed");
      }

      toast.success("Personal access token saved");
      log.info("Handle save personal access token success");
    },

    // Fetch lastest handler
    handleFetchLatest: async () => {
      log.info("Handling fetch latest...");
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "waiting") {
        log.error(`Incorrect status for fetching latest: ${appStatus}`);
        return;
      }

      const success = await invokeWithSleep(() => window.backend?.fetchLatest(), DELAY);
      if (!success) {
        log.info("Handle fetch latest failed");
      }

      toast.success("Latest fetched");
      log.info("Handle fetch latest success");
    },

    // Clear cache handler
    handleClearCache: async () => {
      log.info("Handling clear cache...");
      const { appStatus } = useAppStore.getState();
      if (appStatus !== "waiting") {
        log.error(`Incorrect status for clearing cache: ${appStatus}`);
        return;
      }

      const success = await invokeWithSleep(() => window.backend?.clearCache(), DELAY);
      if (!success) {
        log.info("Handle clear cache failed");
      }

      toast.success("Cache cleared");
      log.info("Handle clear cache success");
    },
  };
}
