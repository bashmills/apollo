import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function DialogContainer({ children }: Props) {
  return <div className="w-full flex flex-col justify-center items-center min-h-0 space-y-6">{children}</div>;
}
