import { PointerEvent, ReactNode, TransitionEvent, useEffect, useRef } from "react";
import { IconButton } from "../ui/icon-button";
import { createPortal } from "react-dom";

interface Props {
  onSetVisible: (value: boolean) => void;
  onClose: () => void;
  onBack?: () => void;
  visible: boolean;
  title?: string;
  children: ReactNode;
}

export function Dialog({ onSetVisible, onClose, onBack, visible, title, children }: Props) {
  const pointerDownOnBackdrop = useRef(false);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) {
      return;
    }

    if (visible) {
      return;
    }

    onClose();
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerDownOnBackdrop.current && event.currentTarget !== event.target) {
      pointerDownOnBackdrop.current = false;
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = event.currentTarget === event.target;
    event.stopPropagation();
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerDownOnBackdrop.current && event.currentTarget === event.target) {
      handleClose();
    }

    pointerDownOnBackdrop.current = false;
    event.stopPropagation();
  };

  const handleClose = () => {
    onSetVisible(false);
  };

  const handleBack = () => {
    if (!onBack) {
      handleClose();
      return;
    }

    onBack();
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [visible]);

  useEffect(() => {
    onSetVisible(true);
  }, [onSetVisible]);

  return createPortal(
    <div
      className={`fixed inset-0 z-40 flex justify-center items-center backdrop-blur-sm bg-black/50 text-white p-4 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      onTransitionEnd={handleTransitionEnd}
      onPointerMove={(x) => handlePointerMove(x)}
      onPointerDown={(x) => handlePointerDown(x)}
      onPointerUp={(x) => handlePointerUp(x)}
    >
      <div className={`w-full flex flex-col max-h-3/4 max-w-3xl rounded-2xl p-6 space-y-6 border border-gray-700/50 bg-gray-800/80 shadow-2xl transform transition-transform duration-200 ${visible ? "scale-100" : "scale-0"}`} onPointerDown={(x) => x.stopPropagation()} onPointerUp={(x) => x.stopPropagation()}>
        <div className="flex items-center justify-between">
          <IconButton onClick={handleBack} icon="back" />
          {title && (
            <div className="flex-1 min-w-0 text-center">
              <h2 className="font-semibold text-gray-200 truncate">{title}</h2>
            </div>
          )}
          <IconButton onClick={handleClose} icon="close" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
