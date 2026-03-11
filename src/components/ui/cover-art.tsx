import { useAppStore } from "../../store/app-store";
import { useEffect, useState } from "react";
import { Icon } from "./icon";

interface Props {
  className: string;
  id?: string;
}

export function CoverArt({ className, id }: Props) {
  const [src, setSrc] = useState<string | undefined | null>(undefined);
  const appStatus = useAppStore((x) => x.appStatus);

  const shouldHide = appStatus === "waiting" || appStatus === "downloading" || !id;

  useEffect(() => {
    if (shouldHide) {
      setSrc(undefined);
      return;
    }

    let mounted = true;

    async function load() {
      const value = id ? await window.backend?.requestCoverArt(id) : null;
      if (!mounted) {
        return;
      }

      setSrc(value);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [shouldHide, id]);

  return (
    <div className={`${className}`}>
      {src !== undefined && src !== null && <img className="size-full rounded-md object-cover" src={`apollo://cover-art/${src}`} />}
      {src === undefined && <div className="size-full rounded-md bg-gray-500/70 animate-pulse" />}
      {src === null && <Icon className="size-full rounded-md" icon="missing" />}
    </div>
  );
}
