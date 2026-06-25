import { useDialogStore } from "../../hooks/use-dialog-store";
import { DialogContents } from "./dialog-contents";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  id: string;
}

export function PersistContents({ children, id }: Props) {
  const { setScrollPosition, scrollPosition } = useDialogStore(id).getState();
  return (
    <DialogContents setScrollPosition={setScrollPosition} scrollPosition={scrollPosition}>
      {children}
    </DialogContents>
  );
}
