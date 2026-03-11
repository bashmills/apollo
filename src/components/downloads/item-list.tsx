import { ItemRowSkeleton, ItemRow } from "./item-row";
import { Release, Item } from "../../../shared/types";
import { useAppStore } from "../../store/app-store";
import { ItemGroup } from "./item-group";

interface Grouping {
  release?: Release;
  items: Item[];
  id?: string;
}

const NUM_SKELETONS = 6;

export function ItemList() {
  const appStatus = useAppStore((x) => x.appStatus);
  const items = useAppStore((x) => x.items);

  const showGroups = appStatus === "downloaded" || appStatus === "saving" || appStatus === "saved";
  const groups = showGroups
    ? items.reduce<Grouping[]>((groups, item) => {
        const release = item.releases?.at(0);
        const existing = groups.find((x) => release?.id === x?.id);
        if (existing) {
          existing.items.push(item);
        } else {
          const id = release?.id;
          groups.push({
            release,
            items: [item],
            id,
          });
        }

        return groups;
      }, [])
    : [];

  const hasGroups = groups.length > 0;
  const hasItems = items.length > 0;

  return (
    <div className="space-y-2">
      {hasItems && hasGroups && groups.map((group, index) => <ItemGroup release={group.release} items={group.items} key={group.id ?? index} />)}
      {hasItems && !hasGroups && items.map((item, index) => <ItemRow item={item} key={item.id ?? index} />)}
      {!hasItems && Array.from({ length: NUM_SKELETONS }).map((_, index) => <ItemRowSkeleton key={index} />)}
    </div>
  );
}
