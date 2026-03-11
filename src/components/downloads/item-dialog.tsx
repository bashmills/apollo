import { ReleaseDetails } from "./item-dialog/release-details";
import { MetadataForm } from "./item-dialog/metadata-form";
import { ReleaseList } from "./item-dialog/release-list";
import { CustomForm } from "./item-dialog/custom-form";
import { SearchList } from "./item-dialog/search-list";
import { Release, Item } from "../../../shared/types";
import { Dialog } from "../ui/dialog";
import { useState } from "react";

type View = "releases" | "detail" | "metadata" | "custom" | "search";

interface Props {
  onClose: () => void;
  item: Item;
}

export function ItemDialog({ onClose, item }: Props) {
  const [selected, setSelected] = useState<Release>();
  const [view, setView] = useState<View>("releases");
  const [visible, setVisible] = useState(false);

  const handleSearchRelease = (release: Release) => {
    setSelected(release);
    setView("search");
  };

  const handleViewRelease = (release: Release) => {
    setSelected(release);
    setView("detail");
  };

  const handleRequestClose = () => {
    setVisible(false);
  };

  const handleBack = () => {
    if (view === "search") {
      setView("custom");
      return;
    }

    if (view !== "releases") {
      setView("releases");
      return;
    }

    setVisible(false);
  };

  return (
    <Dialog onSetVisible={setVisible} onClose={onClose} onBack={handleBack} visible={visible} title={item.title}>
      {view === "releases" && <ReleaseList onOverride={() => setView("metadata")} onCustom={() => setView("custom")} onSelect={handleViewRelease} item={item} />}
      {view === "detail" && <ReleaseDetails onRequestClose={handleRequestClose} release={selected} item={item} />}
      {view === "metadata" && <MetadataForm onRequestClose={handleRequestClose} item={item} />}
      {view === "custom" && <CustomForm onRequestClose={handleRequestClose} onSearch={handleSearchRelease} item={item} />}
      {view === "search" && <SearchList onRequestClose={handleRequestClose} release={selected} item={item} />}
    </Dialog>
  );
}
