export interface ToggleItem<T extends string> {
  title: string;
  key: T;
}

interface Props<T extends string> {
  onClick: (key: T) => void;
  toggles: ToggleItem<T>[];
  disabled?: boolean;
  current: T;
}

export function ButtonToggle<T extends string>({ onClick, toggles, disabled, current }: Props<T>) {
  return (
    <div className="w-full max-w-xl flex justify-center items-center overflow-hidden rounded-xl shadow-lg">
      {toggles.map((toggle, index) => (
        <button
          className={`w-full px-4 py-2 font-semibold transition-all duration-200 ${toggle.key === current ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-600 hover:bg-gray-500"} ${disabled ? "cursor-not-allowed opacity-50" : ""} truncate`}
          onClick={() => onClick(toggle.key)}
          disabled={disabled}
          type="button"
          key={toggle.key ?? index}
        >
          {toggle.title}
        </button>
      ))}
    </div>
  );
}
