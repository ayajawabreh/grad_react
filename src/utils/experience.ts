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
