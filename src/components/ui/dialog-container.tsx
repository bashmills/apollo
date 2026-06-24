import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function DialogContainer({ children }: Props) {
  return <div className="w-full flex flex-1 flex-col justify-center items-center min-h-0 space-y-6">{children}</div>;
}
