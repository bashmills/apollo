import { DialogContainer } from "../ui/dialog-container";
import { DialogContents } from "../ui/dialog-contents";
import { ProgressStatus } from "./progress-status";
import { ActionButtons } from "./action-buttons";
import { ItemList } from "./item-list";

export function ItemsView() {
  return (
    <DialogContainer>
      <ProgressStatus />
      <DialogContents>
        <ItemList />
      </DialogContents>
      <ActionButtons />
    </DialogContainer>
  );
}
