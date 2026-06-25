import { DialogStoreContext } from "../contexts/dialog-store-context";
import { DialogState } from "../store/dialog-store";
import { ReactNode, useState } from "react";
import { StoreApi } from "zustand";

interface Props {
  children: ReactNode;
}

export function DialogStoreProvider({ children }: Props) {
  const [store] = useState(() => new Map<string, StoreApi<DialogState>>());
  return <DialogStoreContext.Provider value={store}>{children}</DialogStoreContext.Provider>;
}
