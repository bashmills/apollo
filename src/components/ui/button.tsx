import { Spinner } from "./spinner";
import { ReactNode } from "react";

export type Variant = "primary" | "secondary" | "success" | "danger";
export type Size = "large" | "medium" | "small";

interface Props {
  onClick?: () => void;
  type: "submit" | "reset" | "button";
  disabled?: boolean;
  loading?: boolean;
  variant: Variant;
  size: Size;
  children: ReactNode;
}

const VARIANT_BUTTON_STYLES = new Map<Variant, string>([
  ["primary", "from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"],
  ["secondary", "from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400"],
  ["success", "from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"],
  ["danger", "from-red-600 to-red-500 hover:from-red-500 hover:to-red-400"],
]);

const SIZE_BUTTON_STYLES = new Map<Size, string>([
  ["large", "max-w-96"],
  ["medium", "max-w-72"],
  ["small", "max-w-48"],
]);

const DISABLED_STYLE = "bg-gray-600 cursor-not-allowed opacity-50";

export function Button({ onClick, disabled, loading, variant, size, type, children }: Props) {
  return (
    <button className={`w-full ${SIZE_BUTTON_STYLES.get(size)} px-6 py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 bg-linear-to-r truncate ${!disabled && !loading ? VARIANT_BUTTON_STYLES.get(variant) : DISABLED_STYLE}`} onClick={onClick} disabled={disabled} type={type}>
      {loading && (
        <div className="w-full h-6 flex justify-center items-center">
          <Spinner />
        </div>
      )}
      {!loading && children}
    </button>
  );
}
