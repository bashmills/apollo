import { DialogContainer } from "../../ui/dialog-container";
import { DialogContents } from "../../ui/dialog-contents";
import { useHandlers } from "../../../hooks/use-handlers";
import { Release, Item } from "../../../../shared/types";
import { GroupDetail } from "./contents/group-detail";
import { Button } from "../../ui/button";

interface Props {
  onClose: () => void;
  release?: Release;
  items: Item[];
}

export function GroupDetails({ onClose, release, items }: Props) {
  const { handleSelectReleases } = useHandlers();

  const handleSelect = () => {
    if (!release) {
      return;
    }

    handleSelectReleases(release, items);
    onClose();
  };

  return (
    <DialogContainer>
      <DialogContents>
        <GroupDetail label="Secondary Types" value={release?.secondaryTypes?.join(", ")} />
        <GroupDetail label="Primary Type" value={release?.primaryType} />
        <GroupDetail label="Album Artist" value={release?.performer ?? release?.artist} />
        <GroupDetail label="Album" value={release?.album} />
        <GroupDetail label="Country" value={release?.country} />
        <GroupDetail label="Format" value={release?.format} />
        <GroupDetail label="Status" value={release?.status} />
        <GroupDetail label="Total" value={release?.total?.toString()} />
        <GroupDetail label="Date" value={release?.date} />
        <GroupDetail label="Group" value={release?.group} />
        <GroupDetail label="Id" value={release?.id} />
      </DialogContents>
      <div className="w-full flex justify-center items-center">
        <Button onClick={handleSelect} variant="primary" size="medium" type="button">
          Select Release
        </Button>
      </div>
    </DialogContainer>
  );
}
