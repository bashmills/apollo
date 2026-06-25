import { ReactNode, useEffect, useState, useRef } from "react";

interface Props {
  setScrollPosition?: (value: number) => void;
  scrollPosition?: number;
  children: ReactNode;
}

export function DialogContents({ setScrollPosition, scrollPosition, children }: Props) {
  const [showBottom, setShowBottom] = useState(true);
  const [showTop, setShowTop] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const updateFades = () => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = element;
    setShowBottom(scrollTop + clientHeight < scrollHeight);
    setShowTop(scrollTop > 0);
  };

  const handleScroll = () => {
    const element = ref.current;
    if (setScrollPosition && element) {
      setScrollPosition(element.scrollTop);
    }

    updateFades();
  };

  useEffect(() => {
    const element = ref.current;
    if (!scrollPosition || !element) {
      return;
    }

    element.scrollTop = scrollPosition;
  }, [scrollPosition]);

  useEffect(() => {
    updateFades();
  }, [children]);

  return (
    <div className="relative w-full flex flex-1 flex-col min-h-0">
      <div className="size-full overflow-y-auto p-4 rounded-xl space-y-2 border bg-gray-700/10 border-gray-600/30" onScroll={handleScroll} ref={ref}>
        {children}
      </div>
      <div className={`pointer-events-none absolute rounded-b-xl bottom-px left-0 right-0 h-8 bg-linear-to-t from-gray-800/80 to-transparent transition-opacity duration-100 ${showBottom ? "opacity-100" : "opacity-0"}`} />
      <div className={`pointer-events-none absolute rounded-t-xl top-px left-0 right-0 h-8 bg-linear-to-b from-gray-800/80 to-transparent transition-opacity duration-100 ${showTop ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
