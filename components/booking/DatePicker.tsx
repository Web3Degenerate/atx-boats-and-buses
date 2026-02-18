"use client";

import { DayPicker } from "react-day-picker";

type DatePickerProps = {
  selectedDate?: Date;
  onDateSelect: (date?: Date) => void;
  disabledDates: Date[];
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function DatePicker({ selectedDate, onDateSelect, disabledDates }: DatePickerProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        disabled={[{ before: startOfToday() }, ...disabledDates]}
        showOutsideDays
        className="text-sm"
        classNames={{
          months: "flex",
          month: "space-y-3",
          caption: "flex items-center justify-center pb-2",
          caption_label: "text-base font-semibold text-primary",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell: "w-10 text-center text-xs font-semibold text-slate-500",
          row: "mt-1 flex w-full",
          cell: "h-10 w-10 text-center",
          day: "h-10 w-10 rounded-md hover:bg-slate-100",
          day_disabled: "text-slate-300 line-through",
          day_today: "font-semibold text-primary"
        }}
        modifiersStyles={{
          selected: {
            backgroundColor: "#F5A623",
            color: "#1E3A5F"
          }
        }}
      />
    </div>
  );
}
