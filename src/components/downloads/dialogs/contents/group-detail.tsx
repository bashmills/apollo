interface Props {
  value?: string;
  label: string;
}

export function GroupDetail({ label, value }: Props) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-400 text-left shrink-0 truncate">{label}: </span>
      <span className="text-gray-200 text-right truncate">{value || "??"}</span>
    </div>
  );
}
