"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, Zap } from "lucide-react";

interface DeliveryTypeToggleProps {
  value: "instant" | "scheduled";
  onChange: (value: "instant" | "scheduled") => void;
  disabled?: boolean;
}

export function DeliveryTypeToggle({
  value,
  onChange,
  disabled = false,
}: DeliveryTypeToggleProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as "instant" | "scheduled")}
      disabled={disabled}
      className="grid grid-cols-2 gap-4"
    >
      <div>
        <RadioGroupItem
          value="instant"
          id="instant"
          className="peer sr-only"
        />
        <Label
          htmlFor="instant"
          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
        >
          <Zap className="mb-3 h-6 w-6" />
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium leading-none">Instant Delivery</p>
            <p className="text-xs text-muted-foreground">
              Delivered in 30-40 mins
            </p>
          </div>
        </Label>
      </div>

      <div>
        <RadioGroupItem
          value="scheduled"
          id="scheduled"
          className="peer sr-only"
        />
        <Label
          htmlFor="scheduled"
          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
        >
          <Clock className="mb-3 h-6 w-6" />
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium leading-none">
              Scheduled Delivery
            </p>
            <p className="text-xs text-muted-foreground">
              Pre-order up to 2 days
            </p>
          </div>
        </Label>
      </div>
    </RadioGroup>
  );
}
