import { DialogContainer } from "../../ui/dialog-container";
import { DialogContents } from "../../ui/dialog-contents";
import { ReleaseDetail } from "./contents/release-detail";
import { useHandlers } from "../../../hooks/use-handlers";
import { Release, Item } from "../../../../shared/types";
import { Button } from "../../ui/button";

interface Props {
  onRequestClose: () => void;
  release?: Release;
  item: Item;
}

export function ReleaseDetails({ onRequestClose, release, item }: Props) {
  const { handleSelectRelease } = useHandlers();

  const handleSelect = () => {
    if (!release) {
      return;
    }

    handleSelectRelease(release, item);
    onRequestClose();
  };

  return (
    <DialogContainer>
      <DialogContents>
        <ReleaseDetail label="Score" value={release?.score?.toString()} />
        <ReleaseDetail label="Secondary Types" value={release?.secondaryTypes?.join(", ")} />
        <ReleaseDetail label="Primary Type" value={release?.primaryType} />
        <ReleaseDetail label="Album Artist" value={release?.performer ?? release?.artist} />
        <ReleaseDetail label="Artist" value={release?.artist} />
        <ReleaseDetail label="Album" value={release?.album} />
        <ReleaseDetail label="Title" value={release?.title} />
        <ReleaseDetail label="Country" value={release?.country} />
        <ReleaseDetail label="Format" value={release?.format} />
        <ReleaseDetail label="Status" value={release?.status} />
        <ReleaseDetail label="Total" value={release?.total?.toString()} />
        <ReleaseDetail label="Track" value={release?.track?.toString()} />
        <ReleaseDetail label="Disc" value={release?.disc?.toString()} />
        <ReleaseDetail label="Date" value={release?.date} />
        <ReleaseDetail label="Group" value={release?.group} />
        <ReleaseDetail label="Id" value={release?.id} />
      </DialogContents>
      <div className="w-full flex justify-center items-center">
        <Button onClick={handleSelect} variant="primary" size="medium" type="button">
          Select Release
        </Button>
      </div>
    </DialogContainer>
  );
}
