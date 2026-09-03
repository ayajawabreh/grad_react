import DatePicker from "react-datepicker";
import { format, isValid, parse } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { C, F } from "../../constants/tokens";

export function EnglishDatePicker({ value, onChange, required = false, minDate = new Date() }: { value: string; onChange: (value: string) => void; required?: boolean; minDate?: Date | null }) {
  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const selected = parsed && isValid(parsed) ? parsed : null;
  return <div lang="en-US" dir="ltr" style={{ width: "100%", direction: "ltr" }}><DatePicker selected={selected} onChange={(date: Date | null) => onChange(date ? format(date, "yyyy-MM-dd") : "")} dateFormat="yyyy-MM-dd" placeholderText="YYYY-MM-DD" minDate={minDate ?? undefined} required={required} showMonthDropdown showYearDropdown dropdownMode="select" calendarStartDay={0} popperPlacement="bottom-start" portalId="root" wrapperClassName="english-date-picker" customInput={<input lang="en-US" dir="ltr" inputMode="numeric" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box", direction: "ltr" }}/>} /><style>{`.english-date-picker { width: 100%; }`}</style></div>;
}
