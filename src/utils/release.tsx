import { Release } from "../../shared/types";

export function getReleaseKey(release: Release): string | null {
  if (!release.key || !release.id) {
    return null;
  }

  const result = `${release.key}-${release.id}`;
  return result;
}
