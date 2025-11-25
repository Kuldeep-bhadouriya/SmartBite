"use client";

import { useState } from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  maxDaysAhead?: number;
}

export function DateSelector({
  selectedDate,
  onDateSelect,
  maxDaysAhead = 2,
}: DateSelectorProps) {
  const today = startOfDay(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(0);

  // Generate array of available dates
  const availableDates = Array.from({ length: maxDaysAhead + 1 }, (_, i) =>
    addDays(today, i)
  );

  // Visible dates (show 3 at a time on mobile, all on desktop)
  const visibleDates = availableDates.slice(
    currentWeekStart,
    currentWeekStart + 3
  );

  const canGoBack = currentWeekStart > 0;
  const canGoForward = currentWeekStart + 3 < availableDates.length;

  const handlePrevious = () => {
    if (canGoBack) {
      setCurrentWeekStart((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNext = () => {
    if (canGoForward) {
      setCurrentWeekStart((prev) =>
        Math.min(availableDates.length - 3, prev + 1)
      );
    }
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
  };

  const getDateLabel = (date: Date) => {
    const isToday = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
    const isTomorrow =
      format(date, "yyyy-MM-dd") === format(addDays(today, 1), "yyyy-MM-dd");

    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";
    return format(date, "EEE");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-medium">Select Delivery Date</h3>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={!canGoBack}
          className="h-8 w-8 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 grid grid-cols-3 gap-2">
          {visibleDates.map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all hover:border-primary/50",
                isDateSelected(date)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-background"
              )}
            >
              <span className="text-xs font-medium">{getDateLabel(date)}</span>
              <span className="text-lg font-bold">{format(date, "d")}</span>
              <span className="text-xs">{format(date, "MMM")}</span>
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={!canGoForward}
          className="h-8 w-8 shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop view - show all dates */}
      <div className="hidden md:grid md:grid-cols-3 gap-2">
        {availableDates.map((date) => (
          <button
            key={date.toISOString()}
            onClick={() => onDateSelect(date)}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all hover:border-primary/50",
              isDateSelected(date)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted bg-background"
            )}
          >
            <span className="text-sm font-medium">{getDateLabel(date)}</span>
            <span className="text-2xl font-bold">{format(date, "d")}</span>
            <span className="text-sm">{format(date, "MMM")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
