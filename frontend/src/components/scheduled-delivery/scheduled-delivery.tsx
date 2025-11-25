"use client";

import { useState, useEffect } from "react";
import { DeliveryTypeToggle } from "./delivery-type-toggle";
import { DateSelector } from "./date-selector";
import { TimeSlotSelector, TimeSlot } from "./time-slot-selector";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { format } from "date-fns";

interface ScheduledDeliveryProps {
  restaurantId: number;
  onDeliveryChange: (delivery: {
    type: "instant" | "scheduled";
    date?: Date;
    timeSlotId?: number;
    timeSlotName?: string;
  }) => void;
}

export function ScheduledDelivery({
  restaurantId,
  onDeliveryChange,
}: ScheduledDeliveryProps) {
  const [deliveryType, setDeliveryType] = useState<"instant" | "scheduled">(
    "instant"
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch time slots when date is selected
  useEffect(() => {
    if (deliveryType === "scheduled" && selectedDate && restaurantId) {
      fetchTimeSlots();
    }
  }, [selectedDate, restaurantId, deliveryType]);

  // Notify parent component of changes
  useEffect(() => {
    if (deliveryType === "instant") {
      onDeliveryChange({ type: "instant" });
    } else if (
      deliveryType === "scheduled" &&
      selectedDate &&
      selectedTimeSlot
    ) {
      const selectedSlot = timeSlots.find(
        (slot) => slot.time_slot_id === selectedTimeSlot
      );
      onDeliveryChange({
        type: "scheduled",
        date: selectedDate,
        timeSlotId: selectedTimeSlot,
        timeSlotName: selectedSlot?.time_slot_name,
      });
    }
  }, [deliveryType, selectedDate, selectedTimeSlot]);

  const fetchTimeSlots = async () => {
    setLoading(true);
    setError(null);
    setSelectedTimeSlot(null);

    try {
      const formattedDate = format(selectedDate!, "yyyy-MM-dd");
      const response = await fetch(
        `/api/v1/time-slots/restaurants/${restaurantId}/slot-availability?start_date=${formattedDate}&days=1`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch time slots");
      }

      const data = await response.json();

      if (data && data.length > 0) {
        setTimeSlots(data[0].available_slots || []);
      } else {
        setTimeSlots([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load time slots"
      );
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryTypeChange = (type: "instant" | "scheduled") => {
    setDeliveryType(type);
    if (type === "instant") {
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setTimeSlots([]);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset time slot when date changes
  };

  const handleTimeSlotSelect = (slotId: number) => {
    setSelectedTimeSlot(slotId);
  };

  return (
    <div className="space-y-6">
      {/* Delivery Type Toggle */}
      <DeliveryTypeToggle
        value={deliveryType}
        onChange={handleDeliveryTypeChange}
      />

      {/* Scheduled Delivery Options */}
      {deliveryType === "scheduled" && (
        <>
          <Separator />

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Pre-order your meal up to 2 days in advance. Select your preferred
              date and time slot.
            </AlertDescription>
          </Alert>

          {/* Date Selector */}
          <DateSelector
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            maxDaysAhead={2}
          />

          {/* Time Slot Selector */}
          {selectedDate && (
            <>
              <Separator />
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <TimeSlotSelector
                  slots={timeSlots}
                  selectedSlotId={selectedTimeSlot}
                  onSlotSelect={handleTimeSlotSelect}
                  loading={loading}
                />
              )}
            </>
          )}

          {/* Selection Summary */}
          {selectedDate && selectedTimeSlot && (
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
              <p className="text-sm font-medium text-primary">
                Delivery scheduled for:
              </p>
              <p className="text-lg font-semibold">
                {format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
                {timeSlots.find((s) => s.time_slot_id === selectedTimeSlot)
                  ?.time_slot_name}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
