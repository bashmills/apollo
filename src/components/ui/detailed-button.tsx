import { ReactNode } from "react";

export type Variant = "success" | "warning" | "error" | "working" | "pending";

interface Props {
  onClick?: () => void;
  disabled?: boolean;
  variant: Variant;
  children: ReactNode;
}

const BACKGROUND_STYLES = new Map<Variant, string>([
  ["success", "bg-green-600/10 border-green-500/30 hover:bg-green-500/20"],
  ["warning", "bg-yellow-600/10 border-yellow-500/30 hover:bg-yellow-500/20"],
  ["error", "bg-red-600/10 border-red-500/30 hover:bg-red-500/20"],
  ["working", "bg-blue-600/10 border-blue-500/30 hover:bg-blue-500/20"],
  ["pending", "bg-gray-700/10 border-gray-600/30 hover:bg-gray-600/20"],
]);

const TEXT_STYLES = new Map<Variant, string>([
  ["success", "text-green-400"],
  ["warning", "text-yellow-400"],
  ["error", "text-red-400"],
  ["working", "text-blue-400"],
  ["pending", "text-gray-400"],
]);

export function DetailedButton({ onClick, disabled, variant, children }: Props) {
  return (
    <button className={`w-full p-4 rounded-xl transition-all duration-200 border ${BACKGROUND_STYLES.get(variant)} ${TEXT_STYLES.get(variant)}`} onClick={onClick} disabled={disabled} type="button">
      {children}
    </button>
  );
}
