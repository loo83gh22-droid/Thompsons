"use client";

import { useState } from "react";
import ReactDatePicker from "react-datepicker";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

export type DateRange = { start: Date; end: Date | null };

interface DatePickerProps {
  value?: Date | DateRange;
  onChange: (date: Date | DateRange) => void;
  label?: string;
  required?: boolean;
  /** When true, show range mode toggle and allow selecting start/end (e.g. trip dates). */
  allowRange?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  label = "Date",
  required = false,
  allowRange = false,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    value instanceof Date ? value : value?.start ?? new Date()
  );
  const [dateRange, setDateRange] = useState<DateRange>(
    value && typeof value === "object" && "start" in value
      ? value
      : { start: new Date(), end: null }
  );
  const [showRange, setShowRange] = useState(allowRange);

  const displayDate = value ?? selectedDate;
  const displayRange =
    value && typeof value === "object" && "start" in value ? value : dateRange;

  const handleSingleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      onChange(date);
    }
  };

  const handleRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    if (start) {
      const newRange: DateRange = { start, end: end ?? null };
      setDateRange(newRange);
      onChange(newRange);
    }
  };

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none";
  const calendarClass = "react-datepicker-dark";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[var(--muted)]">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {allowRange && (
          <button
            type="button"
            onClick={() => setShowRange(!showRange)}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-muted)]"
          >
            {showRange ? "Single date" : "Date range"}
          </button>
        )}
      </div>
      {!showRange && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => handleSingleDateChange(today)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm hover:bg-[var(--surface-hover)] transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleSingleDateChange(yesterday)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm hover:bg-[var(--surface-hover)] transition-colors"
          >
            Yesterday
          </button>
        </div>
      )}
      {showRange ? (
        <ReactDatePicker
          selectsRange
          startDate={displayRange.start}
          endDate={displayRange.end}
          onChange={handleRangeChange}
          dateFormat="MMM d, yyyy"
          maxDate={today}
          showPopperArrow={false}
          showYearDropdown
          scrollableYearDropdown
          yearDropdownItemNumber={50}
          showMonthDropdown
          className={inputClass}
          calendarClassName={calendarClass}
          placeholderText="Select trip dates"
          required={required}
        />
      ) : (
        <ReactDatePicker
          selected={displayDate instanceof Date ? displayDate : displayRange.start}
          onChange={handleSingleDateChange}
          dateFormat="MMMM d, yyyy"
          maxDate={today}
          showPopperArrow={false}
          showYearDropdown
          scrollableYearDropdown
          yearDropdownItemNumber={50}
          showMonthDropdown
          className={inputClass}
          calendarClassName={calendarClass}
          required={required}
        />
      )}
      <p className="text-xs text-[var(--muted)]">
        {showRange && displayRange.end
          ? `${format(displayRange.start, "MMM d, yyyy")} – ${format(displayRange.end, "MMM d, yyyy")}`
          : showRange
            ? "Select end date (optional)"
            : `Selected: ${format(displayDate instanceof Date ? displayDate : displayRange.start, "MMMM d, yyyy")}`}
      </p>
    </div>
  );
}
