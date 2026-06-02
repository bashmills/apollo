export interface ToggleItem<T extends string> {
  title: string;
  key: T;
}

interface Props<T extends string> {
  onClick: (key: T) => void;
  toggles: ToggleItem<T>[];
  current: T;
}

export function ButtonToggle<T extends string>({ onClick, toggles, current }: Props<T>) {
  return (
    <div className="w-xl flex justify-center items-center overflow-hidden rounded-xl shadow-lg">
      {toggles.map((toggle, index) => (
        <button className={`w-full px-4 py-2 font-semibold transition-all duration-200 ${toggle.key === current ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-600 hover:bg-gray-500"} truncate`} onClick={() => onClick(toggle.key)} type="button" id={toggle.key ?? index}>
          {toggle.title}
        </button>
      ))}
    </div>
  );
}
