import { Release, Item } from "../../../shared/types";
import { Dialog } from "../ui/dialog";
import { useState } from "react";
import { GroupList } from "./group-dialog/group-list";
import { GroupDetails } from "./group-dialog/group-details";

type View = "groups" | "detail";

interface Props {
  onClose: () => void;
  release?: Release;
  items: Item[];
}

export function GroupDialog({ onClose, release, items }: Props) {
  const [selected, setSelected] = useState<Release>();
  const [view, setView] = useState<View>("groups");
  const [visible, setVisible] = useState(false);

  const handleViewRelease = (release: Release) => {
    setSelected(release);
    setView("detail");
  };

  const handleRequestClose = () => {
    setVisible(false);
  };

  const handleBack = () => {
    if (view !== "groups") {
      setView("groups");
      return;
    }

    setVisible(false);
  };

  return (
    <Dialog onSetVisible={setVisible} onClose={onClose} onBack={handleBack} visible={visible} title={release?.album}>
      {view === "groups" && <GroupList onSelect={handleViewRelease} onClose={handleRequestClose} items={items} />}
      {view === "detail" && <GroupDetails onClose={handleRequestClose} release={selected} items={items} />}
    </Dialog>
  );
}
