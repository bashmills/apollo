import { ReactNode } from "react";

interface Props {
  className: string;
  children?: ReactNode;
  icon: string;
}

export function Icon({ className, children, icon }: Props) {
  if (!children) {
    return <img className={`${className}`} src={`./icons/${icon}.svg`} alt={icon} />;
  }

  return (
    <span className="flex justify-center items-center gap-x-3">
      <img className={`${className}`} src={`./icons/${icon}.svg`} alt={icon} />
      {children}
    </span>
  );
}
