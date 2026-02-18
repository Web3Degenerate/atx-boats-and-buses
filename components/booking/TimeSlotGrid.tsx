"use client";

import { TimeSlot } from "@/types";

type TimeSlotGridProps = {
  slots: TimeSlot[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  label: string;
};

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export default function TimeSlotGrid({ slots, selectedTime, onTimeSelect, label }: TimeSlotGridProps) {
  const columns: TimeSlot[][] = [];
  const perColumn = Math.ceil(slots.length / 4);

  for (let i = 0; i < slots.length; i += perColumn) {
    columns.push(slots.slice(i, i + perColumn));
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-semibold text-primary">{label}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-2">
            {column.map((slot) => {
              const isSelected = selectedTime === slot.startTime;

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => onTimeSelect(slot.startTime)}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    isSelected
                      ? "bg-secondary font-bold text-primary"
                      : slot.isAvailable
                        ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        : "border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  {formatTime12h(slot.startTime)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
