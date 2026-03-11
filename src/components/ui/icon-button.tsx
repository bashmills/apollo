import { MouseEvent } from "react";
import { Icon } from "./icon";

interface Props {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  icon: string;
}

export function IconButton({ onClick, disabled, icon }: Props) {
  return (
    <button className="size-9 flex justify-center items-center rounded-full transition-all duration-200 hover:bg-gray-500/50" onClick={onClick} disabled={disabled} type="button">
      <Icon className="size-5" icon={icon} />
    </button>
  );
}
