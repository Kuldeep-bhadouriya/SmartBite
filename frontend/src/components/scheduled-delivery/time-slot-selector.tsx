"use client";

import { Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TimeSlot {
  time_slot_id: number;
  time_slot_name: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  remaining_capacity: number;
  total_capacity: number;
  slot_surcharge: number;
  reason?: string;
}

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selectedSlotId: number | null;
  onSlotSelect: (slotId: number) => void;
  loading?: boolean;
}

export function TimeSlotSelector({
  slots,
  selectedSlotId,
  onSlotSelect,
  loading = false,
}: TimeSlotSelectorProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
          <h3 className="text-sm font-medium">Loading time slots...</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-medium">Select Time Slot</h3>
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No time slots available for selected date
          </p>
        </div>
      </div>
    );
  }

  const getCapacityColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return "text-green-600";
    if (percentage > 20) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-medium">Select Time Slot</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.time_slot_id;
          const capacityPercentage =
            (slot.remaining_capacity / slot.total_capacity) * 100;

          return (
            <button
              key={slot.time_slot_id}
              onClick={() =>
                slot.is_available && onSlotSelect(slot.time_slot_id)
              }
              disabled={!slot.is_available}
              className={cn(
                "relative flex flex-col items-start justify-between rounded-lg border-2 p-4 text-left transition-all",
                slot.is_available
                  ? "hover:border-primary/50 cursor-pointer"
                  : "opacity-50 cursor-not-allowed bg-muted",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-muted bg-background"
              )}
            >
              {/* Time slot name */}
              <div className="flex items-center justify-between w-full mb-2">
                <span
                  className={cn(
                    "text-lg font-semibold",
                    isSelected && "text-primary"
                  )}
                >
                  {slot.time_slot_name}
                </span>
                {slot.slot_surcharge > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +₹{slot.slot_surcharge}
                  </Badge>
                )}
              </div>

              {/* Availability info */}
              {slot.is_available ? (
                <div className="flex items-center gap-1 text-xs">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      capacityPercentage > 50
                        ? "bg-green-600"
                        : capacityPercentage > 20
                        ? "bg-orange-600"
                        : "bg-red-600"
                    )}
                  />
                  <span
                    className={getCapacityColor(
                      slot.remaining_capacity,
                      slot.total_capacity
                    )}
                  >
                    {slot.remaining_capacity} slot{slot.remaining_capacity !== 1 ? "s" : ""} left
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  <span>{slot.reason || "Not available"}</span>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 text-primary-foreground"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-600" />
          <span>Many slots</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-orange-600" />
          <span>Few slots</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-red-600" />
          <span>Almost full</span>
        </div>
      </div>
    </div>
  );
}
