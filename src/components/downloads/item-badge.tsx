import { Item } from "../../../shared/types";
import { Spinner } from "../ui/spinner";
import { Icon } from "../ui/icon";

interface Props {
  item: Item;
}

export function ItemBadge({ item }: Props) {
  if (item.itemStatus !== "downloading" && item.itemStatus !== "fetching" && item.itemStatus !== "saving") {
    return <Icon className="size-5" icon={`items/${item.itemStatus}`} />;
  } else {
    return <Spinner />;
  }
}
