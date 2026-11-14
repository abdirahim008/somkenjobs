import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DatePostedPreset = "any" | "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

export interface DatePostedFilterValue {
  preset: DatePostedPreset;
  from: string; // yyyy-mm-dd, used when preset === "custom"
  to: string;   // yyyy-mm-dd, used when preset === "custom"
}

export const EMPTY_DATE_POSTED_FILTER: DatePostedFilterValue = { preset: "any", from: "", to: "" };

export const isDatePostedFilterActive = (f: DatePostedFilterValue): boolean =>
  f.preset !== "any" && (f.preset !== "custom" || !!f.from || !!f.to);

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// Parse yyyy-mm-dd as a local calendar date (new Date("yyyy-mm-dd") would be UTC).
const parseLocalDate = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/** Returns [start, end) in local time for the filter, or null when no date limit applies. */
const getRange = (f: DatePostedFilterValue): [Date | null, Date | null] | null => {
  const today = startOfDay(new Date());
  switch (f.preset) {
    case "today": return [today, addDays(today, 1)];
    case "yesterday": return [addDays(today, -1), today];
    case "7d": return [addDays(today, -6), addDays(today, 1)];
    case "30d": return [addDays(today, -29), addDays(today, 1)];
    case "month": return [new Date(today.getFullYear(), today.getMonth(), 1), addDays(today, 1)];
    case "custom": {
      const from = parseLocalDate(f.from);
      const to = parseLocalDate(f.to);
      if (!from && !to) return null;
      return [from, to ? addDays(to, 1) : null];
    }
    default: return null;
  }
};

export const matchesDatePosted = (datePosted: unknown, f: DatePostedFilterValue): boolean => {
  const range = getRange(f);
  if (!range) return true;
  if (!datePosted) return false;
  const posted = new Date(datePosted as string);
  if (isNaN(posted.getTime())) return false;
  const [start, end] = range;
  return (!start || posted >= start) && (!end || posted < end);
};

export const formatPostedDate = (datePosted: unknown): string => {
  if (!datePosted) return "";
  const d = new Date(datePosted as string);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

interface Props {
  value: DatePostedFilterValue;
  onChange: (value: DatePostedFilterValue) => void;
}

export function DatePostedFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="sm:w-44">
        <Select
          value={value.preset}
          onValueChange={(preset) => onChange({ ...value, preset: preset as DatePostedPreset })}
        >
          <SelectTrigger aria-label="Filter by date posted">
            <SelectValue placeholder="Date posted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any date</SelectItem>
            <SelectItem value="today">Posted today</SelectItem>
            <SelectItem value="yesterday">Posted yesterday</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="custom">Custom range…</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value.preset === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Posted from"
            value={value.from}
            max={value.to || undefined}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="w-full sm:w-40"
          />
          <span className="text-sm text-gray-500">to</span>
          <Input
            type="date"
            aria-label="Posted to"
            value={value.to}
            min={value.from || undefined}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="w-full sm:w-40"
          />
        </div>
      )}
    </div>
  );
}
