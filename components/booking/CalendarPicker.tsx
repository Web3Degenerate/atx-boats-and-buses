"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

type CalendarPickerProps = {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  placeholder: string;
  disabledBefore?: Date;
  disabledAfter?: Date;
  disabledDates?: Date[];
};

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateLabel(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function CalendarPicker({
  selectedDate,
  onDateSelect,
  placeholder,
  disabledBefore,
  disabledAfter,
  disabledDates = []
}: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selected = selectedDate ? parseDateKey(selectedDate) : undefined;

  const disabled = useMemo(() => {
    const rules: Array<{ before?: Date; after?: Date } | Date> = [
      { before: disabledBefore || new Date() },
      ...disabledDates
    ];

    if (disabledAfter) {
      rules.push({ after: disabledAfter });
    }

    return rules;
  }, [disabledBefore, disabledAfter, disabledDates]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-md border border-white/10 bg-neutral-700 px-3 py-2 text-sm text-white"
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{selectedDate ? formatDateLabel(selectedDate) : placeholder}</span>
        </span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onDayClick={(date, modifiers) => {
              if (modifiers.disabled) return;
              onDateSelect(formatDateKey(date));
              requestAnimationFrame(() => {
                setIsOpen(false);
              });
            }}
            disabled={disabled as any}
            className="text-sm"
            classNames={{
              months: "flex",
              month: "space-y-3",
              caption: "flex items-center justify-between pb-2",
              caption_label: "text-base font-semibold text-primary",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "w-10 text-center text-xs font-semibold text-slate-500",
              row: "mt-1 flex w-full",
              cell: "h-10 w-10 text-center",
              day: "h-10 w-10 rounded-md hover:bg-slate-100",
              day_disabled: "text-slate-300 line-through",
              day_today: "border border-slate-300 font-semibold"
            }}
            modifiersStyles={{
              selected: {
                backgroundColor: "#dc2626",
                color: "white",
                borderRadius: "4px"
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
