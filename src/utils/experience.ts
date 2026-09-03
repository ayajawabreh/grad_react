export function formatExperienceRange(minValue: unknown, maxValue: unknown) {
  const min = minValue == null || minValue === "" ? null : Number(minValue);
  const max = maxValue == null || maxValue === "" ? null : Number(maxValue);
  const validMin = min != null && Number.isFinite(min) ? min : null;
  const validMax = max != null && Number.isFinite(max) ? max : null;
  if (validMin != null && validMax != null) return `${validMin}–${validMax} years of experience`;
  if (validMin != null) return `At least ${validMin} years`;
  if (validMax != null) return `Up to ${validMax} years`;
  return "Experience not specified";
}

const parseExperienceMonth = (value: unknown, useCurrentMonth = false) => {
  const raw = String(value ?? "").trim();
  if (useCurrentMonth && /^present|current|now$/i.test(raw)) {
    const now = new Date();
    return now.getUTCFullYear() * 12 + now.getUTCMonth();
  }

  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw);
  if (!match) return null;
  return Number(match[1]) * 12 + Number(match[2]) - 1;
};

export function calculateExperienceYears(value: unknown): number | null {
  let items: any[] = [];
  if (Array.isArray(value)) items = value;
  else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) items = parsed;
    } catch {
      return null;
    }
  }

  const ranges = items
    .map((item) => {
      const start = parseExperienceMonth(item?.start_date ?? item?.start_year);
      const end = parseExperienceMonth(item?.end_date ?? item?.end_year, true);
      return start != null && end != null && end >= start ? [start, end] as const : null;
    })
    .filter((range): range is readonly [number, number] => range !== null)
    .sort((a, b) => a[0] - b[0]);

  if (ranges.length === 0) return null;

  const merged: Array<[number, number]> = [];
  ranges.forEach(([start, end]) => {
    const previous = merged[merged.length - 1];
    if (!previous || start > previous[1] + 1) merged.push([start, end]);
    else previous[1] = Math.max(previous[1], end);
  });

  const totalMonths = merged.reduce((total, [start, end]) => total + end - start + 1, 0);
  return Math.round((totalMonths / 12) * 10) / 10;
}

export function resolveExperienceYears(explicitValue: unknown, experience: unknown): number | null {
  const calculated = calculateExperienceYears(experience);
  const explicit = explicitValue == null || explicitValue === "" ? null : Number(explicitValue);
  const validExplicit = explicit != null && Number.isFinite(explicit) && explicit >= 0 ? explicit : null;

  // Date ranges are the source of truth when a stale stored total says zero.
  if (calculated != null && (validExplicit == null || (validExplicit === 0 && calculated > 0))) return calculated;
  return validExplicit;
}
