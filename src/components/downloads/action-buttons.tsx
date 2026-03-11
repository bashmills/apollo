import { useHandlers } from "../../hooks/use-handlers";
import { useAppStore } from "../../store/app-store";
import { Button } from "../ui/button";

export function ActionButtons() {
  const { handleCancel, handleReset, handleRetry, handleSave } = useHandlers();
  const appStatus = useAppStore((x) => x.appStatus);
  const items = useAppStore((x) => x.items);

  return (
    <div className="w-full flex flex-col justify-center items-center space-y-2">
      {(appStatus === "downloading" || appStatus === "saving") && (
        <Button onClick={handleCancel} loading={appStatus === "saving"} variant="danger" size="large" type="button">
          Cancel Downloads
        </Button>
      )}
      {(appStatus === "downloaded" || appStatus === "saved") && (
        <Button onClick={handleReset} variant="primary" size="large" type="button">
          Reset Downloads
        </Button>
      )}
      {items.some((x) => x.itemStatus === "missing" || x.itemStatus === "failed") && appStatus === "downloaded" && (
        <Button onClick={handleRetry} variant="secondary" size="large" type="button">
          Retry Failed
        </Button>
      )}
      {appStatus === "downloaded" && (
        <Button onClick={handleSave} variant="success" size="large" type="button">
          Save Downloads
        </Button>
      )}
    </div>
  );
}
