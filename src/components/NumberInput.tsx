import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  className?: string;
  placeholder?: string;
}

/**
 * A number input that uses internal string state so mobile keyboards
 * don't dismiss on every keystroke and you can freely clear/type values.
 * Commits the final number on blur.
 */
export const NumberInput = ({ value, onChange, min, className, placeholder }: NumberInputProps) => {
  const [text, setText] = useState(String(value));
  const isFocused = useRef(false);

  // Sync external value when not focused
  useEffect(() => {
    if (!isFocused.current) {
      setText(String(value));
    }
  }, [value]);

  const handleBlur = () => {
    isFocused.current = false;
    const parsed = parseInt(text, 10);
    if (isNaN(parsed)) {
      const fallback = min ?? 0;
      onChange(fallback);
      setText(String(fallback));
    } else {
      const clamped = min !== undefined ? Math.max(min, parsed) : parsed;
      onChange(clamped);
      setText(String(clamped));
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9\-]*"
      className={cn(className)}
      placeholder={placeholder}
      value={text}
      onFocus={() => { isFocused.current = true; }}
      onChange={e => setText(e.target.value)}
      onBlur={handleBlur}
    />
  );
};
