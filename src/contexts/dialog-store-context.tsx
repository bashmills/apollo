import { DialogState } from "../store/dialog-store";
import { createContext } from "react";
import { StoreApi } from "zustand";

export const DialogStoreContext = createContext<Map<string, StoreApi<DialogState>> | undefined>(undefined);
