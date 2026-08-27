export function formatExperienceMonth(value?: string | null): string {
  if (!value) return "";
  if (value.trim().toLowerCase() === "present") return "Present";
  const match = value.trim().match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) return value;
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" })
    .format(new Date(Number(match[1]), Number(match[2]) - 1, 1));
}

export function formatExperienceDates(start?: string | null, end?: string | null): string {
  return [formatExperienceMonth(start), formatExperienceMonth(end)].filter(Boolean).join(" — ");
}
