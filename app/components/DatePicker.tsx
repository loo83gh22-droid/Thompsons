"use client";

import { useState, useEffect } from "react";
import ReactDatePicker from "react-datepicker";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  required?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  label = "Date",
  required = false,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value ?? new Date());

  useEffect(() => {
    if (value) setSelectedDate(value);
  }, [value]);

  const handleChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      onChange(date);
    }
  };

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--muted)]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => handleChange(today)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm hover:bg-[var(--surface-hover)] transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleChange(yesterday)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm hover:bg-[var(--surface-hover)] transition-colors"
        >
          Yesterday
        </button>
      </div>
      <ReactDatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="MMMM d, yyyy"
        maxDate={today}
        showPopperArrow={false}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
        required={required}
      />
      <p className="text-xs text-[var(--muted)]">
        Selected: {format(selectedDate, "MMMM d, yyyy")}
      </p>
    </div>
  );
}
