"use client";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface QuickAddBarProps {
  onAdd: (title: string) => void;
  onClose: () => void;
}

export function QuickAddBar({ onAdd, onClose }: QuickAddBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
      onClose();
    }
  };

  return (
    <div className="fixed bottom-[72px] left-0 right-0 px-4 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-layer-1 border border-brand-accent/30 rounded-card px-4 py-3 shadow-dialog max-w-[430px] mx-auto">
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onClose();
          }}
          placeholder="Enter Quick Task Here"
          className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-quick outline-none"
        />
        <button
          onClick={handleSubmit}
          className="w-8 h-8 rounded-[8px] bg-brand flex items-center justify-center active:scale-90 transition-transform"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
