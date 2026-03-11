import { ImageType } from "../../../shared/types";
import { CoverArt } from "./cover-art";
import { Thumbnail } from "./thumbnail";
import { MouseEvent } from "react";
import { Icon } from "./icon";

interface Props {
  className: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  imageType: ImageType;
  thumbnail?: string;
  coverArt?: string;
}

export function ImageSwitch({ className, onClick, imageType, thumbnail, coverArt }: Props) {
  return (
    <button className="relative group" onClick={onClick} data-tooltip-content={`Showing ${imageType === "thumbnail" ? "Thumbnail" : "Cover Art"}`} data-tooltip-id="image-type">
      {imageType === "thumbnail" && <Thumbnail className={className} id={thumbnail} />}
      {imageType === "cover-art" && <CoverArt className={className} id={coverArt} />}
      <div className="absolute inset-0 flex justify-center items-center rounded-md bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <div className="size-10 flex justify-center items-center rounded-full transition-all duration-200 group-hover:bg-gray-500/50">
          <Icon className="size-8" icon="switch" />
        </div>
      </div>
    </button>
  );
}
