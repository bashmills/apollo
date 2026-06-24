import { ReleaseDetails } from "./contents/release-details";
import { Release, Item } from "../../../../shared/types";
import { MetadataForm } from "./contents/metadata-form";
import { ReleaseList } from "./contents/release-list";
import { CustomForm } from "./contents/custom-form";
import { SearchList } from "./contents/search-list";
import { Dialog } from "../../ui/dialog";
import { useState } from "react";

type View = "releases" | "detail" | "metadata" | "custom" | "search";

interface Props {
  onClose: () => void;
  item: Item;
}

export function ItemDialog({ onClose, item }: Props) {
  const [view, setView] = useState<View>(item.metadataType === "youtube" ? "metadata" : "releases");
  const [selected, setSelected] = useState<Release>();
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
    if (item.metadataType === "youtube") {
      setVisible(false);
      return;
    }

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

  const expand = view === "releases";

  return (
    <Dialog onSetVisible={setVisible} onClose={onClose} onBack={handleBack} visible={visible} expand={expand} title={item.title}>
      {view === "releases" && <ReleaseList onOverride={() => setView("metadata")} onCustom={() => setView("custom")} onSelect={handleViewRelease} item={item} />}
      {view === "detail" && <ReleaseDetails onRequestClose={handleRequestClose} release={selected} item={item} />}
      {view === "metadata" && <MetadataForm onRequestClose={handleRequestClose} item={item} />}
      {view === "custom" && <CustomForm onRequestClose={handleRequestClose} onSearch={handleSearchRelease} item={item} />}
      {view === "search" && <SearchList onRequestClose={handleRequestClose} release={selected} item={item} />}
    </Dialog>
  );
}
