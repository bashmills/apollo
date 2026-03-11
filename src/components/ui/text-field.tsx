import { HTMLInputTypeAttribute, ReactNode } from "react";

interface Props {
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  error?: string;
  value: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  children: ReactNode;
}

export function TextField({ onChange, placeholder, inputMode, required, disabled, hidden, error, value, label, type, children }: Props) {
  return (
    <div className="w-full space-y-2">
      {!hidden && (
        <div className="flex items-center justify-between px-3 gap-2">
          <label className="text-sm text-gray-400 text-left" htmlFor={label}>
            {children}
          </label>
          {required && <span className="text-xs text-gray-400/50 text-right truncate">(Required)</span>}
        </div>
      )}
      <input
        className={`w-full px-6 py-4 bg-gray-700/50 border ${error ? "border-red-600" : "border-gray-600"} rounded-xl placeholder-gray-500/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
        onChange={(x) => onChange(x.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
        value={value}
        type={type}
        id={label}
      />
      {error && (
        <div className="flex items-center px-3 text-left">
          <span className="text-xs text-red-400/50 truncate">{error}</span>
        </div>
      )}
    </div>
  );
}
