export const numberOrNull = (value: string | number | null | undefined): number | null =>
  value === "" || value === null || value === undefined ? null : Number(value);

export const isExperienceYears = (value: number | null): boolean =>
  value === null || (Number.isFinite(value) && value >= 0 && value <= 60);
