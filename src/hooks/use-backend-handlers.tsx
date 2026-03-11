import { useAppStore } from "../store/app-store";
import { Item } from "../../shared/types";
import { useEffect } from "react";
import { toast } from "sonner";
import log from "electron-log/renderer";

export function useBackendEvents() {
  useEffect(() => {
    const handleUpdateItems = (items: Item[]) => {
      log.info(`Handling update items: ${items.length}`);
      const { setItems } = useAppStore.getState();
      setItems(items);
    };

    const handleUpdateItem = (item: Item) => {
      log.info(`Handling update item: ${item.id}`);
      const { updateItem } = useAppStore.getState();
      updateItem(item);
    };

    const handleShowError = (error: Error) => {
      log.info(`Handling show error: ${error}`);
      toast.error(error.message);
    };

    const offUpdateItems = window.backend?.onUpdateItems(handleUpdateItems);
    const offUpdateItem = window.backend?.onUpdateItem(handleUpdateItem);
    const offShowError = window.backend?.onShowError(handleShowError);

    return () => {
      offUpdateItems?.();
      offUpdateItem?.();
      offShowError?.();
    };
  }, []);
}
