"use client";

import { useRef, useState, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";
import { cn } from "@/lib/utils/cn";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({ length = 6, onComplete, disabled, error }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    inputsRef.current[index]?.focus();
  }, []);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const digit = value.slice(-1);
      const newValues = [...values];
      newValues[index] = digit;
      setValues(newValues);

      if (digit && index < length - 1) {
        focusInput(index + 1);
      }

      const otp = newValues.join("");
      if (otp.length === length && newValues.every((v) => v !== "")) {
        onComplete(otp);
      }
    },
    [values, length, onComplete, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !values[index] && index > 0) {
        focusInput(index - 1);
      }
    },
    [values, focusInput]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (!pasted) return;
      const newValues = Array(length).fill("");
      for (let i = 0; i < pasted.length; i++) {
        newValues[i] = pasted[i];
      }
      setValues(newValues);
      const nextIndex = Math.min(pasted.length, length - 1);
      focusInput(nextIndex);
      if (pasted.length === length) {
        onComplete(pasted);
      }
    },
    [length, onComplete, focusInput]
  );

  return (
    <div className="flex gap-3 justify-center" role="group" aria-label="One-time password">
      {values.map((value, index) => (
        <div key={index} className="relative">
          {/* Glow effect for focused input */}
          {focusedIndex === index && (
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal-500 rounded-xl opacity-30 blur-sm animate-pulse" />
          )}

          {/* Input container */}
          <div
            className={cn(
              "relative overflow-hidden rounded-xl transition-all duration-200",
              focusedIndex === index && "scale-105",
              error && "animate-shake"
            )}
          >
            <input
              ref={(el) => { inputsRef.current[index] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={value}
              disabled={disabled}
              aria-label={`Digit ${index + 1}`}
              aria-invalid={error || undefined}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              className={cn(
                "relative h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-2 text-center text-xl sm:text-2xl font-bold",
                "bg-background/50 backdrop-blur-sm",
                "transition-all duration-200",
                "focus:outline-none focus:border-primary focus:ring-0",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                error
                  ? "border-destructive bg-destructive/5 text-destructive"
                  : value
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30",
                "placeholder:text-muted-foreground/30"
              )}
              placeholder={focusedIndex === index ? "" : "-"}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
            />

            {/* Filled indicator dot */}
            {value && !error && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary animate-in fade-in zoom-in duration-200" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
