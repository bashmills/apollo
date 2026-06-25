import { useDialogStore } from "./use-dialog-store";
import { DialogState } from "../store/dialog-store";
import { useStore } from "zustand";

export function useDialogState<T>(id: string, selector: (state: DialogState) => T): T {
  return useStore(useDialogStore(id), selector);
}
