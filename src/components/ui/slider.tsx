"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue' | 'value'> {
  onValueChange?: (value: number[]) => void;
  defaultValue?: number[];
  value?: number[];
  max?: number;
  min?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onValueChange, defaultValue, value: externalValue, max = 100, min = 0, step = 1, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(externalValue?.[0] ?? defaultValue?.[0] ?? min);

    React.useEffect(() => {
      if (externalValue !== undefined) {
        setInternalValue(externalValue[0]);
      }
    }, [externalValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value);
      if (externalValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.([newValue]);
    };

    const percentage = ((internalValue - min) / (max - min)) * 100;

    return (
      <div className={cn("relative w-full h-8 flex items-center group", className)}>
        <div className="absolute w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--brand-accent)] transition-all duration-300 ease-out" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={internalValue}
          onChange={handleChange}
          className="absolute w-full h-2 appearance-none bg-transparent cursor-pointer z-10 
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-6 
            [&::-webkit-slider-thumb]:h-6 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:border-4 
            [&::-webkit-slider-thumb]:border-[var(--brand-accent)] 
            [&::-webkit-slider-thumb]:shadow-lg 
            [&::-webkit-slider-thumb]:transition-transform 
            [&::-webkit-slider-thumb]:active:scale-110
            [&::-moz-range-thumb]:w-6 
            [&::-moz-range-thumb]:h-6 
            [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-white 
            [&::-moz-range-thumb]:border-4 
            [&::-moz-range-thumb]:border-[var(--brand-accent)] 
            [&::-moz-range-thumb]:shadow-lg
          "
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
