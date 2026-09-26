import React from 'react';
import { PresetScenario } from '../types';
import { Bookmark } from 'lucide-react';

interface PresetsBarProps {
  presets: PresetScenario[];
  activeId: string | null;
  onSelectPreset: (preset: PresetScenario) => void;
  onReset: () => void;
}

export const PresetsBar: React.FC<PresetsBarProps> = ({
  presets,
  activeId,
  onSelectPreset,
  onReset,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 mr-1 select-none">
        <Bookmark className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>Scenarios:</span>
      </div>

      {presets.map((preset) => {
        const isActive = activeId === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              isActive
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {preset.name}
          </button>
        );
      })}

      <button
        onClick={onReset}
        className="text-xs px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 ml-auto transition-colors"
      >
        Reset defaults
      </button>
    </div>
  );
};
