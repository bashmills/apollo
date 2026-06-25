import { DialogState, createDialogStore } from "../store/dialog-store";
import { DialogStoreContext } from "../contexts/dialog-store-context";
import { useContext } from "react";
import { StoreApi } from "zustand";

export function useDialogStore(id: string): StoreApi<DialogState> {
  const context = useContext(DialogStoreContext);
  if (!context) {
    throw new Error("Trying to use dialog store without provider");
  }

  let store = context.get(id);
  if (!store) {
    store = createDialogStore();
    context.set(id, store);
  }

  return store;
}
