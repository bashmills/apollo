import { StoreApi, createStore } from "zustand";

export interface DialogState {
  setScrollPosition: (scrollPosition: number) => void;
  setFilter: (filter: string) => void;

  scrollPosition: number;
  filter: string;
}

export const createDialogStore = (): StoreApi<DialogState> => {
  return createStore<DialogState>((set) => ({
    setScrollPosition: (scrollPosition: number) => set({ scrollPosition }),
    setFilter: (filter: string) => set({ filter }),

    scrollPosition: 0,
    filter: "",
  }));
};
