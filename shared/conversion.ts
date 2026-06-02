const NUMBER_REGEX = new RegExp("[^0-9]", "g");

export function sanitizeDate(value: string): string {
  const digits = sanitizeInt(value).slice(0, 8);
  if (digits.length > 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }

  if (digits.length > 4) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return digits;
}

export function sanitizeInt(value: string): string {
  return value.replace(NUMBER_REGEX, "");
}

export function convertInt(value: string): number {
  return Number(sanitizeInt(value));
}
