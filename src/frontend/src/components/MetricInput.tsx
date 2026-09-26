import React from 'react';

interface MetricInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
  onChange: (val: number) => void;
}

export const MetricInput: React.FC<MetricInputProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  description,
  onChange,
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(Math.min(max, Math.max(min, val)));
    }
  };

  // Compute percentage for smooth filled track gradient
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
            {label}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {description}
          </p>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2 py-1">
          <input
            type="number"
            id={`${id}-num`}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleNumberChange}
            className="w-14 sm:w-16 text-right text-xs font-mono font-medium text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
          />
          <span className="text-xs text-slate-400 dark:text-slate-500 select-none font-mono">
            {unit}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          style={{
            background: `linear-gradient(to right, #ea580c 0%, #f97316 ${percentage}%, var(--slider-empty) ${percentage}%, var(--slider-empty) 100%)`,
          }}
          className="w-full h-2 block cursor-pointer"
        />
        <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-1.5">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
};
