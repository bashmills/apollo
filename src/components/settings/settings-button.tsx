import { Dispatch, ReactNode, SetStateAction } from "react";
import { invokeWithSleep } from "../../utils/promise";
import { Button, Variant } from "../ui/button";

interface Props {
  onCallback: () => Promise<void>;
  setWorkers: Dispatch<SetStateAction<string[]>>;
  workers: string[];
  variant: Variant;
  worker: string;
  children: ReactNode;
}

const DELAY = 200;

export function SettingsButton({ onCallback, setWorkers, workers, variant, worker, children }: Props) {
  const handleOnClick = async () => {
    setWorkers((prev) => [...prev.filter((x) => x !== worker), worker]);
    await invokeWithSleep(() => onCallback(), DELAY);
    setWorkers((prev) => [...prev.filter((x) => x !== worker)]);
  };

  return (
    <Button onClick={() => handleOnClick()} disabled={workers.includes(worker)} loading={workers.includes(worker)} variant={variant} size="medium" type="button">
      {children}
    </Button>
  );
}
