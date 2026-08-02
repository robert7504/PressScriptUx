const TIME_ZONE = "Europe/Warsaw";

export function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: TIME_ZONE,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      dateStyle: "medium",
      timeZone: TIME_ZONE,
    }).format(new Date(value));
  } catch {
    return value;
  }
}
