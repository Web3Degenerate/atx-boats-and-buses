"use client";

import { TimeSlot } from "@/types";

type TimeRangeSelectorProps = {
  availableSlots: TimeSlot[];
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  minimumHours: number;
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getDurationHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    return 0;
  }

  return (toMinutes(endTime) - toMinutes(startTime)) / 60;
}

export default function TimeRangeSelector({
  availableSlots,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  minimumHours
}: TimeRangeSelectorProps) {
  const sortedSlots = [...availableSlots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  const startOptions = sortedSlots.filter((slot) => slot.isAvailable);

  const selectedStartIndex = sortedSlots.findIndex((slot) => slot.startTime === startTime);

  const endOptions =
    selectedStartIndex >= 0
      ? (() => {
          const options: string[] = [];

          for (let i = selectedStartIndex; i < sortedSlots.length; i += 1) {
            const slot = sortedSlots[i];
            if (!slot.isAvailable) {
              break;
            }

            const duration = i - selectedStartIndex + 1;
            if (duration >= minimumHours) {
              options.push(slot.endTime);
            }
          }

          return options;
        })()
      : [];

  const durationHours = getDurationHours(startTime, endTime);

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-semibold text-primary">Select Time Range</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Start Time</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={startTime}
            onChange={(event) => onStartTimeChange(event.target.value)}
          >
            <option value="">Select start time</option>
            {startOptions.map((slot) => (
              <option key={slot.startTime} value={slot.startTime}>
                {slot.startTime}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">End Time</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={endTime}
            onChange={(event) => onEndTimeChange(event.target.value)}
            disabled={!startTime}
          >
            <option value="">Select end time</option>
            {endOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-slate-600">Minimum booking: {minimumHours} hours</p>
      <p className="text-sm font-medium text-slate-800">
        Selected duration: {durationHours > 0 ? `${durationHours} hour${durationHours > 1 ? "s" : ""}` : "Not selected"}
      </p>
    </div>
  );
}
